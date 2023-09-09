import React from 'react';
import {View} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';

const Waveform = ({wave}) => {
  const maxValue = 50; // Set the maximum value (consider -50 to -160 as 0)

  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      {wave.map((value, index) => {
        const height = Math.max(0, Math.abs(value + maxValue)); // Calculate the height based on the value
        return (
          <View
            key={index}
            style={{
              width: 2, // Width of the vertical line
              height: height * 1.5, // Height based on the value
              backgroundColor: 'blue',
              marginHorizontal: moderateScale(2),
            }}
          />
        );
      })}
    </View>
  );
};

export default Waveform;
