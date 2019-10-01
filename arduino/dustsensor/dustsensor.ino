/* 
 * ======================================================================
 *  code by / for GEENY / tingg.io unit of Telefónica Germany, 2019
 *  using open source software, license assessment pending
 *  for prototyping only, no warranties yet!
 *  ################# NOT FOR COMMERCIAL DISTRIBUTION! #################
 * ----------------------------------------------------------------------
 *  pin mapping:
 *  D1 --> OLED SCK/SCL (clock)
 *  D2 --> OLED SDA (data)
 *  D5 --> level converter (any channel) --> data pin PPD42NS dust sensor
 *  D6 --> 100 ohm resistor --> blue pin RGB LED
 *  D7 --> 100 ohm resistor --> green pin RGB LED
 *  D8 --> 100 ohm resistor --> red pin RGB LED
 *  3V3 --> VCC OLED, --> level converter LV
 *  5V --> level converter HV
 *  G --> GND OLED, --> cathode RGB LED,
 *    --> level converter GND (both LV and HV)
 * ----------------------------------------------------------------------
 *  Andreas Thol, B2P Product Requirements, DUS 
 *  25.09.2019
 * ======================================================================
 *  about this file:
 *  - prototype for dust sensor using PPD42NS sensor
 *  - dust concentration calculation borrowed from:
 *    http://arduinoairpollution.altervista.org/progetto/
 * ======================================================================
 */

#include <ESP8266WiFi.h>          // for general Wifi connection
#include <PubSubClient.h>         // MQTT client
#include <SPI.h>                  // for OLED display
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Fonts/FreeSans9pt7b.h>  // font file
#include "graphics.h"             // Telefónica / GEENY graphics

// Pins Config
int           Dust          = 14;
int           PinBLUE       = 12; // status LED
int           PinGREEN      = 13;
int           PinRED        = 15;
 
// Wifi Config TEF Guest
const char* ssid            = "YOUR_WIFI_SSID";
const char* password        = "YOUR_WIFI_PASSWORD";

// Thing Config, from tingg.io developers console
const char* thing_id        = "YOUR_THING_ID";
const char* thing_key       = "YOUR_THING_KEY";

// MQTT Config
const char* mqtt_server     = "mqtt.tingg.io";
const int   port            = 1883; // 8883 for mqtts connections

// Topics Config from tingg.io
const char* pubTopicDust    = "dust";        // dust particle concentration
const char* username        = "thing";       // default config

// network
WiFiClient espClient;
PubSubClient client(espClient);

// OLED display
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels
#define OLED_RESET     0 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Vars
long    lastUpdateMillis = 0;
char    buf[12];

//Set variables for dust readings
unsigned long starttime;
unsigned long sampletime_ms = 60000; // TIME BETWEEN MEASURES AND UPDATES

unsigned long triggerOnP1;
unsigned long triggerOffP1;
unsigned long pulseLengthP1;
unsigned long durationP1;
boolean valP1 = HIGH;
boolean triggerP1 = false;
float ratioP1 = 0;
float countP1;
float concDust;
float prevconcDust;

void setup_wifi() {
  delay(10);
  Serial.print("connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print("."); }
  randomSeed(micros());
  Serial.println("");
  Serial.print("WiFi connected on IP address: ");
  Serial.println(WiFi.localIP());
  SetLED("green");
  delay(100);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("attempting to connect MQTT ... ");
    if (client.connect(thing_id, username, thing_key)) {
      Serial.println("connected!");
      SetLED("green"); // = sensor online
      delay(100);
    } else {
      SetLED("red"); // = sensor offline
      Serial.print(" still not connected ...");
      Serial.print(client.state());
      Serial.println(" trying again in 5 seconds");  // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

String message(byte* payload, unsigned int length) {
  payload[length] = '\0';
  String s = String((char*)payload);
  return s;
}

void SetLED(String color) {
  if (color == "red") {           // = network problem
    digitalWrite(PinRED,    HIGH);
    digitalWrite(PinGREEN,  LOW);
    digitalWrite(PinBLUE,   LOW);
  } else if (color == "blue") {   // = currently uploading
    digitalWrite(PinRED,    LOW);
    digitalWrite(PinGREEN,  LOW);
    digitalWrite(PinBLUE,   HIGH);
  } else if (color == "green") {  // = idling
    digitalWrite(PinRED,    LOW);
    digitalWrite(PinGREEN,  HIGH);
    digitalWrite(PinBLUE,   LOW);
  }
}

void measuredust(){
  valP1 = digitalRead(Dust);

  if(valP1 == LOW && triggerP1 == false) {
    triggerP1 = true;
    triggerOnP1 = micros();
  }

  if (valP1 == HIGH && triggerP1 == true) {
    triggerOffP1 = micros();
    pulseLengthP1 = triggerOffP1 - triggerOnP1;
    durationP1 = durationP1 + pulseLengthP1;
    triggerP1 = false;
  }

  if ((millis() - starttime) > sampletime_ms) {
    ratioP1 = durationP1 / (sampletime_ms * 10.0); // Integer percentage 0=>100
    countP1 = 1.1 * pow(ratioP1,3) - 3.8 * pow(ratioP1,2) + 520 * ratioP1 + 0.62;
    float PM25count = countP1;
    
    // count to mass concentration conversion
    double pi = 3.14159;
    double K = 3531.5;
    double density = 1.65*pow(10,12);
    double r25 = 0.44 * pow(10,-6);
    double vol25 = (4/3) * pi * pow(r25,3);
    double mass25 = density * vol25;
    concDust = (PM25count) * K * mass25;

    Serial.print("dust concentration: ");
    Serial.print(concDust);
    Serial.println(" ug/m3");
    
    // Reset Values
    durationP1 = 0;
    starttime = millis();
  }
}


// ##############################################################
// ###################################################### SETUP #
// ##############################################################

void setup() {
  // RGB LED
  pinMode(PinRED,     OUTPUT);
  pinMode(PinGREEN,   OUTPUT);
  pinMode(PinBLUE,    OUTPUT);
  SetLED("red"); // initially, until network established
  // PPD42NS dust sensor
  pinMode(Dust,       INPUT);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // start display
  display.setTextSize(1);                    // Normal 1:1 pixel scale
  display.setTextColor(WHITE);               // Draw white text
 
  // Telefónica and GEENY splashscreens
  display.clearDisplay();
  display.drawBitmap(32, 8, telefonica, 63, 16, 1);
  display.display();
  delay(2000);
  display.startscrollleft(0x00, 0x0F); // scroll screen left; to protect OLED
  delay(3000);
  display.clearDisplay();
  display.drawBitmap(14, 6, geeny, 100, 24, 1);
  display.display();

  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, port);
}

// ##############################################################
// ####################################################### LOOP #
// ##############################################################

void loop() {
  if (!client.connected()) { reconnect(); }
  client.loop();

  measuredust(); // measure dust concentration

  if (millis() - lastUpdateMillis > 15000) { // for prototype: every 15 secs, + delays

    // show value on display
    display.clearDisplay();
    display.setFont();
    display.setCursor(0, 0);
    display.print("Feinstaubwert:");
    display.setFont(&FreeSans9pt7b);
    display.setCursor(0, 28);
    display.drawBitmap(60, 16, unit, 36, 16, 1);
    if (concDust > 0.0) {
      display.print(concDust);
    } else {
      display.print("(-.-)");
    }
    display.display();  // start showing

  // update values on GEENY / tingg.io platform
    SetLED("blue"); // = network activity
    lastUpdateMillis = millis();

    if (prevconcDust != concDust) {
      prevconcDust = concDust;
      client.publish(pubTopicDust, gcvt(concDust, 4, buf));
      Serial.print("Updated dust value on tingg.io to ");
      Serial.println(concDust);
      delay(500);
    }
    SetLED("green"); // = idle
  }
  delay(50);
}
