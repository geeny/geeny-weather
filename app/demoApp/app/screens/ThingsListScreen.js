import React from 'react';
import { Text, StyleSheet, View, Image, ScrollView, Button as ButtonReact } from 'react-native';
import { Card, WingBlank, Button } from '@ant-design/react-native';
import { ApiService } from './../services';
import { NavigationEvents } from 'react-navigation';
import { LogoTitle } from './../components';

export default class ThingsListScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
		return {
			headerTitle: <LogoTitle />,
			headerStyle: {
				backgroundColor: '#FFD52A',
			},
			headerRight: (
				<ButtonReact title={"Abmelden"} onPress={() => navigation.navigate('Login')} />
			),
		};
	};

    constructor(props) {
        super(props);
        this.state = {
            things: [],
        };
    }

    logout() {
        ApiService.logout();
        const { navigate } = this.props.navigation;
        navigate('Login');
    }

    async getThings() {
        await ApiService.loadToken();

        if (ApiService.isLoggedIn()) {
            things = await ApiService.getThings();
            this.setState({ things: things });
        }
        else {
            this.logout();
        }
    }

    loadThing(thingId) {
        ApiService.save('thingId', thingId);

        const { navigate } = this.props.navigation;
        navigate('Dashboard');
    }

    render() {
        return (
            <ScrollView style={styles.screen}>
                <Text style={styles.title}>Deine Things 🤖</Text>
                <NavigationEvents
                    onWillFocus={payload => this.getThings()}
                />
                <WingBlank size="lg">
                    {this.state.things.map((thing, index) =>
                        <Card key={index} style={styles.card}>
                            <Card.Header
                                title={thing.name}
                                thumbStyle={{ width: 30, height: 30 }}
                                thumb={<Image style={{ margin: 5 }} source={require('./../assets/images/icon.png')} />}
                            />
                            <Card.Body>
                                <View style={{ height: 42 }}>
                                    <Text style={{ marginLeft: 16 }}>{thing.id}</Text>
                                </View>
                            </Card.Body>
                            <Button style={{ backgroundColor: '#0074cd', marginLeft: 10, marginRight: 10, marginBottom: 5 }}
                                onPress={() => this.loadThing(thing.id)}
                                type="primary">
                                <Text style={styles.buttonContent}>Dashboard</Text>
                            </Button>
                        </Card>
                    )}
                </WingBlank>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: '#FFD52A',
        paddingTop: 10,
        textAlign: "center",
    },
    title: {
        color: '#021237',
        margin: 5,
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'TrebuchetMS-Bold',
    },
    buttonContent: {
        fontFamily: 'TrebuchetMS',
    },
    card: {
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowColor: '#000000',
        shadowOffset: { height: 0, width: 0 },
        margin: 8,
        backgroundColor: '#eef2f5',
    }
})