import React from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView } from "react-native";
import { Card, WingBlank } from '@ant-design/react-native';
import { ApiService } from './../services';
import { LogoTitle } from './../components';
import { NavigationEvents } from 'react-navigation';

export default class LoginScreen extends React.Component {
    static navigationOptions = {
        headerTitle: <LogoTitle />,
        headerStyle: {
            backgroundColor: '#FFD52A',
        },
    };

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
        };
    }

    async loginUser() {
        await ApiService.login(this.state.email, this.state.password);
        const { navigate } = this.props.navigation;

        if (ApiService.isLoggedIn()) {
            navigate('ThingsList');
        }
        else {
            Alert.alert(
                'Oops!',
                'Bitte noch mal anmelden.',
                [
                    { text: 'OK', onPress: () => this.logout() },
                ],
                { cancelable: false },
            );
        }
    }

    async logout() {
        await ApiService.logout();
    }

    shouldEnable() {
        let {height, width} = Dimensions.get('window');
        return (height < 667);
    }

    render() {
        return (
            <KeyboardAvoidingView style={styles.root} behavior="position" enabled={this.shouldEnable()}>
                <NavigationEvents
                    onWillFocus={payload => this.logout()}
                />
                <WingBlank>
                    <Card style={styles.cardStyle}>
                        <Text style={styles.title}>Bitte einloggen 🤖 </Text>
                        <TextInput
                            autoCapitalize='none'
                            style={styles.textInput}
                            autoCorrect={false}
                            clear
                            value={this.state.email}
                            onChangeText={(value) => {
                                this.setState({
                                    email: value,
                                });
                            }}
                            placeholder="Email">
                        </TextInput>
                        <TextInput
                            autoCapitalize='none'
                            autoCorrect={false}
                            style={styles.textInput}
                            secureTextEntry={true}
                            clear
                            value={this.state.password}
                            onChangeText={(value) => {
                                this.setState({
                                    password: value,
                                });
                            }}
                            placeholder="Passwort">
                        </TextInput>
                        <TouchableOpacity
                            style={buttonstyles.root}
                            onPress={() => this.loginUser()}
                            type="primary">
                            <Text style={buttonstyles.buttonContent}>Anmelden</Text>
                        </TouchableOpacity>

                    </Card>

                </WingBlank>
            </KeyboardAvoidingView>
        );
    }
}


const styles = StyleSheet.create({
    root: {
        backgroundColor: '#FFD52A',
        flex: 1,
        alignItems: "stretch",
        flexDirection: "column",
    },
    textInput: {
        backgroundColor: '#fff',
        height: "10.81%",
        fontSize: 18,
        lineHeight: 18,
        letterSpacing: 0,
        textAlign: "center",
        opacity: 1,
        borderRadius: 3,
        margin: 15
    },
    title: {
        color: '#021237',
        margin: 5,
        padding: 25,
        fontSize: 30,
        fontWeight: 'bold',
        fontFamily: 'TrebuchetMS-Bold',
    },
    cardStyle: {
        marginTop: 20,
        backgroundColor: '#eef2f5',
        height: 400,
        margin: 8,
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowColor: '#000000',
        shadowOffset: { height: 0, width: 0 },
    }
});

const buttonstyles = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#FF2B2E',
        paddingRight: 16,
        paddingLeft: 16,
        borderRadius: 3,
        margin: 15,
    },
    buttonContent: {
        alignSelf: "stretch",
        fontFamily: 'TrebuchetMS-Bold',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 44,
        letterSpacing: 0,
        color: "#fff",
        height: 50,
        width: 100,
        textAlign: "center"
    }
});

