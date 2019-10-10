import React from 'react';
import { View } from 'react-native';
import Dash from 'react-native-dash';
import timer from 'react-native-timer';

// props:
// dotWidth: pt dimension of dots (default 5)
// activeColor: what the active dot color should be (default black)
// activeColor: what the inactive dot color should be (default gray)
// interval: animation interval in ms (default 300)
// value: accepted values 0-10
export default class DottedMeter extends React.Component {
    constructor(props) {
        super(props);

        this.dotWidth = props.dotWidth !== undefined ? props.dotWidth : 5;
        this.activeColor = props.activeColor !== undefined ? props.activeColor : 'black';
        this.inactiveColor = props.inactiveColor !== undefined ? props.inactiveColor : 'gray';
        this.interval = props.interval !== undefined ? props.interval : 300;
        var newValue = props.value !== undefined ? props.value : 0;

        newValue = this.sanitizeValue(newValue);
        this.state = { currentValue: 0, value: newValue };
    }

    sanitizeValue(newValue) {
        if (newValue > 10) {
            newValue = 10;
        }
        else if (newValue < 0) {
            newValue = 0;
        }

        newValue = Math.round(newValue);
        return newValue;
    }

    componentWillUnmount() {
        timer.clearInterval(this);
    }

    async componentDidUpdate(prevProps) {
        if (this.props.value !== prevProps.value) {
            await timer.clearInterval(this, 'animation');

            let newValue = this.sanitizeValue(this.props.value);
            
            await this.setState({value: newValue});
            this.animate();
        }
    }

    animate() {
        if (this.state.value > this.state.currentValue) {
            timer.setInterval(this, 'animation', async () => {
                if (this.state.currentValue == this.state.value) {
                    timer.clearInterval(this, 'animation');
                }
                else {
                    let newValue = Math.round(this.state.currentValue + 1);
                    await this.setState({ currentValue: newValue });
                }
            }, this.interval);
        }
        else if (this.state.value < this.state.currentValue) {
            timer.setInterval(this, 'animation', async () => {
                if (this.state.currentValue == this.state.value) {
                    timer.clearInterval(this, 'animation');
                    this.lock = false;
                }
                else {
                    let newValue = Math.round(this.state.currentValue - 1);
                    await this.setState({ currentValue: newValue });
                }
            }, this.interval);
        }
    }

    render() {
        let totalWidth = this.dotWidth * 20;

        return (
            <View style={{ alignItems: 'flex-start', width: totalWidth }}>
                <Dash style={{ width: totalWidth, height: this.dotWidth, position: 'absolute' }}
                    dashGap={this.dotWidth}
                    dashLength={this.dotWidth}
                    dashThickness={this.dotWidth}
                    dashColor={this.inactiveColor}
                />
                <Dash style={{ width: this.state.currentValue * 10 - 1, height: this.dotWidth, position: 'absolute' }}
                    dashGap={this.dotWidth}
                    dashLength={this.dotWidth}
                    dashThickness={this.dotWidth}
                    dashColor={this.activeColor}
                />
            </View>
        );
    }
}