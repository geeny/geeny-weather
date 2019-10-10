import React from 'react';
import { Image } from 'react-native';
import { ViewPagerAndroid } from 'react-native-gesture-handler';

export default class LogoTitle extends React.Component {
    render() {
        return (
            <Image
                source={require('./../assets/images/tingg.io.png')}
                style={{ width: 87, height: 20 }}
            />
        );
    }
}