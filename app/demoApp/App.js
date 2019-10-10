import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { LoginScreen, ThingsListScreen, DashboardScreen } from './app/screens';

const LoginStackNavigator = createStackNavigator({
  Login: { screen: LoginScreen },
});

const DashboardStackNavigator = createStackNavigator({
  ThingsList: { screen: ThingsListScreen },
  Dashboard: { screen: DashboardScreen },
});

const MainNavigator = createStackNavigator(
  {
    Main: {
      screen: DashboardStackNavigator,
    },
    MyModal: {
      screen: LoginStackNavigator,
    },
  },
  {
    mode: 'modal',
    headerMode: 'none',
  }
);

const App = createAppContainer(MainNavigator);

export default App;