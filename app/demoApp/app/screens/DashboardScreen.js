import React from 'react';
import {
	SafeAreaView,
	StyleSheet,
	Button,
	ScrollView,
	View,
	Text,
	Alert,
	RefreshControl,
	Image,
} from 'react-native';
import { NavigationEvents } from 'react-navigation';
import { Card, WingBlank } from '@ant-design/react-native';
import { ApiService } from './../services';
import { RadialGauge, Gauge, Thermometer } from './../components';
import timer from 'react-native-timer';
import { LogoTitle } from './../components';

export default class DashboardScreen extends React.Component {
	static navigationOptions = ({ navigation }) => {
		return {
			headerTitle: <LogoTitle />,
			headerStyle: {
				backgroundColor: '#FFD52A',
			},
			headerRight: (
				<Button title={"Abmelden"} onPress={() => navigation.navigate('Login')} />
			),
		};
	};

	constructor(props) {
		super(props);
		this.state = {};

		this.getData();
	}

	focus() {
		timer.setInterval(this, 'getData', async () => {
			this.getData();
		}, 15000);
	}

	async getData() {
		await ApiService.loadToken();
		let thingId = await ApiService.getThingId();

		if (ApiService.isLoggedIn()) {
			this.loadData(thingId);
		}
		else {
			timer.clearInterval(this);

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

	onRefresh = async () => {
		this.setState({ refreshing: true });
		console.log("refreshing");
		await this.getData();
		this.setState({ refreshing: false });
		console.log("stop");
	}

	blur() {
		timer.clearInterval(this);
	}

	logout() {
		ApiService.logout();
		const { navigate } = this.props.navigation;
		navigate('Login');
	}

	async loadData(thingId) {
		let data = await ApiService.getData(thingId);
		console.log(data);
		this.setState(data);
	}

	render() {
		const temp1wInWidget = <WingBlank>
			<Card style={styles.cardStyle}>
				<View style={styles.row}>
					<View style={styles.card}>
						<Thermometer
							min={0}
							max={50}
							width={10}
							height={100}
							backgroundColor={'gray'}
							fillColor={'red'}
							current={this.state.temp_1w_in}
						/>
					</View>
					<View style={styles.label}>
						<Text style={styles.value}>{this.state.temp_1w_in}° C</Text>
						<Text style={styles.property}>Innen</Text>
					</View>
				</View>
			</Card>
		</WingBlank>;

		const temp1wOutWidget = <WingBlank>
			<Card style={styles.cardStyle}>
				<View style={styles.row}>
					<View style={styles.card}>
						<Thermometer
							min={0}
							max={50}
							width={10}
							height={100}
							backgroundColor={'gray'}
							fillColor={'red'}
							current={this.state.temp_1w_out}
						/>
					</View>
					<View style={styles.label}>
						<Text style={styles.value}>{this.state.temp_1w_out}° C</Text>
						<Text style={styles.property}>Außen</Text>
					</View>
				</View>
			</Card>
		</WingBlank>;

		const humidityWidget = <WingBlank>
			<Card style={styles.cardStyle}>
				<View style={styles.row}>
					<View style={styles.card}>
						<RadialGauge
							currentValue={this.state.humidity}
							size={135}
						/>
					</View>
					<View style={styles.label}>
						<Text style={{ fontSize: 18 }}>{this.state.humidity}</Text>
						<Text style={styles.property}>Luftfeuchtigkeit</Text>
					</View>
				</View>
			</Card>
		</WingBlank>;

		const temperatureWidget = <WingBlank>
			<Card style={styles.cardStyle}>
				<View style={styles.row}>
					<View style={styles.card}>
						<Thermometer
							min={0}
							max={50}
							width={10}
							height={100}
							backgroundColor={'gray'}
							fillColor={'red'}
							current={this.state.temp_dht}
						/>
					</View>
					<View style={styles.label}>
						<Text style={styles.value}>{this.state.temp_dht}° C</Text>
						<Text style={styles.property}>Temperatur</Text>
					</View>
				</View>
			</Card>
		</WingBlank>;

		const dustWidget = <WingBlank>
			<Card style={styles.cardStyle}>
				<View style={styles.row}>
					<View style={styles.card}>
						<Image style={{ margin: 5, width: 120, height: 120 }} source={require('./../assets/images/air-quality.png')} />
					</View>
					<View style={styles.label}>
						<Text style={{ fontSize: 18, fontWeight: "bold" }}>{this.state.dust} µg/m^3</Text>
						<Text style={styles.property}>Feinstaubwert</Text>
					</View>
				</View>
			</Card>
		</WingBlank>;

		return (
			<SafeAreaView style={styles.container}>
				<NavigationEvents
					onWillFocus={payload => this.focus()}
					onWillBlur={payload => this.blur()}
				/>
				<Text style={styles.title}>Dashboard 🤖</Text>
				<ScrollView
					refreshControl={
						<RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
					}>
					{this.state.dust ? dustWidget : null}
					{this.state.temp_1w_in ? temp1wInWidget : null}
					{this.state.temp_1w_out ? temp1wOutWidget : null}
					{this.state.humidity ? humidityWidget : null}
					{this.state.temp_dht ? temperatureWidget : null}

				</ScrollView>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFD52A',
	},
	row: {
		flexDirection: 'row',
	},
	card: {
		height: 160,
		flex: 0.6,
		justifyContent: 'center',
		alignItems: 'center',
		borderTopLeftRadius: 5,
		borderBottomLeftRadius: 5,
		marginTop: 10,
		marginLeft: 10,
		marginBottom: 0,
		backgroundColor: '#eef2f5',
	},
	label: {
		flex: 0.4,
		justifyContent: 'center',
		alignItems: 'center',
	},
	value: {
		fontSize: 24,
	},
	property: {

	},
	title: {
		color: '#021237',
		margin: 10,
		paddingTop: 10,
		textAlign: 'center',
		fontSize: 20,
		fontFamily: 'TrebuchetMS-Bold',
	},
	cardStyle: {
		margin: 8,
		backgroundColor: '#eef2f5',
		shadowOpacity: 0.25,
		shadowRadius: 3,
		shadowColor: '#000000',
		shadowOffset: { height: 0, width: 0 },
	}
});