#include <Arduino.h>

// Wifi Config
const char* ssid          = "YOUR-WIFI-SSID";
const char* password      = "YOUR-WIFI-PASSWORD";

// Thing Config, from tingg.io developers console
const char* thing_id      = "YOURTHING-ID";
const char* thing_key     = "YOUR-THING-KEY";



//////////////////////////////////////////////////////
// DON'T CHANGE THINGS BELOW THIS LINE
// UNLESS YOU KNOW WHAT YOU ARE DOING

#if defined(ARDUINO_ESP32_DEV)
  #include <WiFi.h>
  // Pins Config
  const uint8_t DHTPin      = 11;
  int           PinRED      = 15;
  int           PinGREEN    = 13;
  int           PinBLUE     = 12;
  int           PinOnBLED   =  2;   // blue OnBoard LED, synced with PinBLUE
  #define       ONE_WIRE_BUS  10
#elif defined(ARDUINO_ESP8266_WEMOS_D1MINI)
  #include <ESP8266WiFi.h>
  // Pins Config
  const uint8_t DHTPin      = D3;
  int           PinRED      = 15;
  int           PinGREEN    = 13;
  int           PinBLUE     = 12;
  int           PinOnBLED   =  2;   // blue OnBoard LED, synced with PinBLUE
  #define       ONE_WIRE_BUS  D5
#endif


#include <PubSubClient.h>         // MQTT client
#include <DHT.h>                  // temperature and humidity sensor https://github.com/adafruit/DHT-sensor-library
                                  // needs https://github.com/adafruit/Adafruit_Sensor
#include <OneWire.h>              // 1wire temperature sensor bus https://www.pjrc.com/teensy/td_libs_OneWire.html
#include <DallasTemperature.h>    // for Dallas DS18B20 temp sensors https://github.com/milesburton/Arduino-Temperature-Control-Library
#include <SPI.h>                  // for OLED display
#include <Wire.h>                 // ..
#include <Adafruit_GFX.h>         // https://github.com/adafruit/Adafruit-GFX-Library
#include <Adafruit_SSD1306.h>     // https://github.com/adafruit/Adafruit_SSD1306
#include <Fonts/FreeSans9pt7b.h>  // font file - part of https://github.com/adafruit/Adafruit-GFX-Library
#include "graphics.h"             // individual pixel graphics


// Topics Config
const char* pubTopicTemp1 = "temp_dht";
const char* pubTopicTemp2 = "temp_1w_in";
const char* pubTopicTemp3 = "temp_1w_out";
const char* pubTopicHum   = "humidity";
const char* pubTopicIP    = "ipaddress";
const char* subTopic      = "label";

// MQTT Config
const char* mqtt_server   = "mqtt.tingg.io";
const int   port          = 1883; // 8883 for mqtts connections
const char* username      = "thing"; // default config


WiFiClient espClient;
PubSubClient client(espClient);

// DHT
// Type of sensor, here: DHT22
#define DHTTYPE DHT22
// Initialize DHT sensor
DHT dht(DHTPin, DHTTYPE);

// 1wire
// for now: 2 hardcoded oneWire sensor IDs
uint8_t sensor1[8] = { 0x28, 0xEE, 0x3F, 0x59, 0x04, 0x16, 0x01, 0x02 }; // internal system temperature sensor
uint8_t sensor2[8] = { 0x28, 0xFF, 0xE3, 0x7A, 0x81, 0x16, 0x04, 0x81 }; // external waterproof sensor
// Setup a oneWire instance to communicate with any OneWire devices
OneWire oneWire(ONE_WIRE_BUS);
// Pass the oneWire reference to Dallas Temperature
DallasTemperature sensors(&oneWire);

// display
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET     0 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Vars
boolean ShowIP           = 0;
int     prevTemp_DHT     = 0;
int     prevHumidity     = 0;
int     prevTemp_1w_in   = 0;
int     prevTemp_1w_out  = 0;
float   Temperature_DHT;
float   Humidity;
float   Temperature_1w_in;
float   Temperature_1w_out;
long    lastUpdateMillis = 0;
char    buf[12];
char    IP[]             = "xxx.xxx.xxx.xxx";
String  label            = "-"; // default, changeable via tingg.io


String message(byte* payload, unsigned int length) {
  payload[length] = '\0';
  String s = String((char*)payload);
  return s;
}

String ShowTemp(float Temp) {
  String s = itoa((int)Temp, buf, 10);
  if ((Temp < 0) && (Temp > -1)) {
    s =+ "-0";
  }
  s += ",";
  if (Temp > 0) {
    s += itoa((int)((Temp - (int)Temp) * 10 + .5), buf, 10);
  } else {
    s += itoa((int)-((Temp - (int)Temp) * 10 - .5), buf, 10);
  }
  Serial.println(s);
  return s;
}

void SetLED(String color) {
  if (color == "red") {
    digitalWrite(PinRED,    HIGH);
    digitalWrite(PinGREEN,  LOW);
    digitalWrite(PinBLUE,   LOW);
    digitalWrite(PinOnBLED, HIGH);
  } else if (color == "blue") {
    digitalWrite(PinRED,    LOW);
    digitalWrite(PinGREEN,  LOW);
    digitalWrite(PinBLUE,   HIGH);
    digitalWrite(PinOnBLED, LOW); // because it's also blue
  } else if (color == "green") {
    digitalWrite(PinRED,    LOW);
    digitalWrite(PinGREEN,  HIGH);
    digitalWrite(PinBLUE,   LOW);
    digitalWrite(PinOnBLED, HIGH);
  } else if (color == "off") {
    digitalWrite(PinRED,    LOW);
    digitalWrite(PinGREEN,  LOW);
    digitalWrite(PinBLUE,   LOW);
    digitalWrite(PinOnBLED, HIGH);
  } else if (color == "white") {
    digitalWrite(PinRED,    HIGH);
    digitalWrite(PinGREEN,  HIGH);
    digitalWrite(PinBLUE,   HIGH);
    digitalWrite(PinOnBLED, HIGH);
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println(topic);
  String msg = message(payload, length);
  Serial.print("label changed to: ");
  Serial.print(msg);
  label = msg;
}


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
    Serial.print("attempting to connect MQTT...");
    if (client.connect(thing_id, username, thing_key)) {
      Serial.println("connected");
      client.subscribe(subTopic);
      SetLED("green"); // = sensor online
      delay(100);
    } else {
      Serial.print(" still not connected...");      // Serial.print(client.state());
      Serial.println(" trying again in 5 seconds"); // Wait 5 seconds before retrying
      SetLED("red"); // = sensor offline
      delay(5000);
    }
  }
}

void setup() {
  pinMode(DHTPin,    INPUT );

  // RGB LED
  pinMode(PinRED,    OUTPUT);
  pinMode(PinGREEN,  OUTPUT);
  pinMode(PinBLUE,   OUTPUT);
  pinMode(PinOnBLED, OUTPUT);
  SetLED("red"); // initial, until network established

  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, port);
  client.setCallback(callback);
  IPAddress ip = WiFi.localIP();
  ip.toString().toCharArray(IP, 16);
  client.publish(pubTopicIP, IP);


  display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // start display
  display.setTextSize(1);                    // Normal 1:1 pixel scale
  display.setTextColor(WHITE);               // Draw white text
  dht.begin();                               // start DHT sensor
  sensors.begin();                           // start 1wire bus

  // GEENY splashscreen
  display.clearDisplay();
  display.drawBitmap(3, 0, telefonica, 123, 16, 1);
  display.drawBitmap(3, 25, geeny, 123, 30, 1);
  display.display();
  delay(5000);
}

void loop() {
  if (!client.connected()) { reconnect(); }
  client.loop();

  Temperature_DHT    = dht.readTemperature() - 1.5;     // get the temperature value of DHT, with 1.5° offset
  Humidity           = (int)(dht.readHumidity() + .5);  // get the humidity value of DHT
  sensors.requestTemperatures();
  Temperature_1w_in  = sensors.getTempC(sensor1);       // get the 1w temperatures
  Temperature_1w_out = sensors.getTempC(sensor2);

  display.clearDisplay();

  // top status bar
  if (label == "-") { // default; show topline above
      display.drawBitmap(9, 0, topline, 109, 16, 1);
  } else {           // show label of this sensorbox
    display.setCursor(0, 12);
    display.setFont(); // default system font
    display.print(label);
  }

  // temp values
  display.setFont(); // default system font
  display.setCursor(12 + 1, 38);
  display.println("ext:");

  display.setFont(&FreeSans9pt7b);
  display.setCursor(12, 32); // indoor temp from DHT
  display.print(ShowTemp(Temperature_DHT));
  display.setCursor(12, 60); // 1w outdoor sensor
  display.print(ShowTemp(Temperature_1w_out));

  // humidity value
  display.setCursor(12 + 64, 32); // indoor humidity from DHT
  display.print(Humidity, 0);
  display.println("%");
  if ((Humidity < 37.5) || (Humidity > 62.5)) {
    display.drawBitmap(12 + 64 + 9, 43, smiley_bad, 16, 16, 1);
  } else if ((Humidity < 42.5) || (Humidity > 57.5)) {
    display.drawBitmap(12 + 64 + 9, 43, smiley_neutral, 16, 16, 1);
  } else {
    display.drawBitmap(12 + 64 + 9, 43, smiley_good, 16, 16, 1);
  }
  delay(150);
  display.display();  // start showing
  display.startscrollleft(0x00, 0x0F); // scroll screen left


  // update values on GEENY / tingg.io platform
  if (millis() - lastUpdateMillis > 10000) { // for prototype: every 10 secs, + delays
    SetLED("blue"); // = network activity
    lastUpdateMillis = millis();
    if (prevTemp_DHT != Temperature_DHT) {
      prevTemp_DHT = Temperature_DHT;
      client.publish(pubTopicTemp1, gcvt(Temperature_DHT, 4, buf));
      Serial.print("Updating Temperature DHT value to ");
      Serial.println(Temperature_DHT);
      delay(150);
    }
    if (prevHumidity != Humidity) {
      prevHumidity = Humidity;
      client.publish(pubTopicHum, itoa(Humidity, buf, 10));
      Serial.print("Updating Humidity value to ");
      Serial.println(Humidity);
      delay(150);
    }
    if (prevTemp_1w_in != Temperature_1w_in) {
      prevTemp_1w_in = Temperature_1w_in;
      client.publish(pubTopicTemp2, gcvt(Temperature_1w_in, 4, buf));
      Serial.print("Updating Temperature 1w IN value to ");
      Serial.println(Temperature_1w_in);
      delay(150);
    }
    if (prevTemp_1w_out != Temperature_1w_out) {
      prevTemp_1w_out = Temperature_1w_out;
      client.publish(pubTopicTemp3, gcvt(Temperature_1w_out, 4, buf));
      Serial.print("Updating Temperature 1w OUT value to ");
      Serial.println(Temperature_1w_out);
      delay(150);
    }
    SetLED("green");
  }
  delay(7100); // let the display scroll, go relaxing
}
