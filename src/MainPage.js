import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Alert,
  Image,
} from 'react-native';
import React, {Component} from 'react';

import RNFetchBlob from 'rn-fetch-blob';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {request, PERMISSIONS, check, RESULTS} from 'react-native-permissions';
import Waveform from './Waveform';

const screenWidth = Dimensions.get('screen').width;

class MainPage extends Component {
  dirs = RNFetchBlob.fs.dirs;
  path = Platform.select({
    ios: undefined,
    android: undefined,

    // Discussion: https://github.com/hyochan/react-native-audio-recorder-player/discussions/479
    // ios: 'https://firebasestorage.googleapis.com/v0/b/cooni-ebee8.appspot.com/o/test-audio.mp3?alt=media&token=d05a2150-2e52-4a2e-9c8c-d906450be20b',
    // ios: 'https://staging.media.ensembl.fr/original/uploads/26403543-c7d0-4d44-82c2-eb8364c614d0',
    // ios: 'hello.m4a',
    // android: `${this.dirs.CacheDir}/hello.mp3`,
  });

  constructor(props) {
    super(props);
    const {route, navigation} = this.props;
    const maxValue = 50;
    this.state = {
      recordSecs: 0,
      recordTime: '00:00:00',
      currentDB: '-160',
      currentPositionSec: 0,
      currentMeteringSec: 0,
      currentDurationSec: 0,
      playTime: '00:00:00',
      duration: '00:00:00',
      wave: [],
      intervalId: null,
      seconds: 0,
      isRunning: false,
      progressbarwidth: 0,
      disableplay: true,
      disablerecord: false,
      disablepause: true,
      disablestop: true,
      disableretake: false,
      disableplaypause: true,

      disableupload: true,
    };

    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.3); // fetch audio volume in every 30 milisecond
  }
  handleBackPress = () => {
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Exit', onPress: () => BackHandler.exitApp()},
      ],
      {cancelable: false},
    );
    return true;
  };

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  render() {
    let playWidth = this.state.disableplay
      ? 0
      : (this.state.currentPositionSec / this.state.currentDurationSec) *
        (this.state.progressbarwidth / 83);

    if (!playWidth) {
      playWidth = 0;
    }

    return (
      <SafeAreaView style={[styles.container, {backgroundColor: 'black'}]}>
        <View style={styles.container2}>
          <View style={{flexDirection: 'row'}}></View>
          <Text style={{color: 'white', fontSize: scale(15)}}>
            Record in silence zone
          </Text>
          <Text style={styles.txtRecordCounter}>
            {Math.floor(20 - this.state.recordSecs / 1000)}
          </Text>
          <View style={styles.viewRecorder}>
            <View style={styles.recordBtnWrapper}>
              <TouchableOpacity
                style={[styles.savebtn, {marginRight: scale(14)}]}
                onPress={() => {
                  this.onRetakeRecord();
                }}
                disabled={this.state.disableretake}>
                <Image
                  source={require('./assets/reload.png')}
                  style={{
                    resizeMode: 'contain',
                    aspectRatio: 1,
                    width: 30,
                    height: 30,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.recordbtn}
                onPress={() => {
                  console.log(this.state.wave, this.state.disablepause);
                  if (this.state.disablepause) {
                    if (this.state.recordSecs === 0) {
                      this.onStartRecord();
                    } else {
                      this.onResumeRecord();
                    }
                  } else {
                    this.onPauseRecord();
                  }
                }}
                disabled={false}>
                {this.state.disablepause ? null : (
                  <Image
                    source={require('./assets/pause.png')}
                    style={{
                      resizeMode: 'contain',
                      aspectRatio: 1,
                      width: 30,
                      height: 30,
                    }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.savebtn,
                  {
                    marginLeft: scale(14),
                    backgroundColor: this.state.disablestop ? 'grey' : 'white',
                  },
                ]}
                onPress={this.onStopRecord}
                disabled={this.state.disablestop}>
                <Image
                  source={require('./assets/check.png')}
                  style={{
                    resizeMode: 'contain',
                    aspectRatio: 1,
                    width: 30,
                    height: 30,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.playaudio}>
            <TouchableOpacity
              style={[
                styles.playbtn,
                {backgroundColor: this.state.disableplay ? 'grey' : 'blue'},
              ]}
              onPress={() => {
                this.onStartPlay();
              }}
              disabled={this.state.disableplay}>
              <Image
                source={require('./assets/play.png')}
                style={{
                  resizeMode: 'contain',
                  aspectRatio: 1,
                  width: 25,
                  height: 25,
                }}
              />
            </TouchableOpacity>
            <View>
              <View style={styles.viewPlayer}>
                <TouchableOpacity style={styles.viewBarWrapper}>
                  <View style={styles.viewBar}>
                    <View style={[styles.viewBarPlay, {width: playWidth}]} />
                  </View>
                </TouchableOpacity>
                <Waveform wave={this.state.wave} />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.uploadbtn,
              {backgroundColor: this.state.disableplay ? 'grey' : 'green'},
            ]}
            onPress={() => {
              Alert.alert(`path : ${this.state.msg}`);
            }}
            disabled={this.state.disableplay}>
            <Text style={styles.uploadtxt}>upload</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const storageWriteStatus = await request(
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        );
        const storageReadStatus = await request(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        );
        const recordAudioStatus = await request(
          PERMISSIONS.ANDROID.RECORD_AUDIO,
        );

        console.log('Storage Write Permission:', storageWriteStatus);
        console.log('Storage Read Permission:', storageReadStatus);
        console.log('Record Audio Permission:', recordAudioStatus);

        if (
          storageWriteStatus === RESULTS.GRANTED &&
          storageReadStatus === RESULTS.GRANTED &&
          recordAudioStatus === RESULTS.GRANTED
        ) {
          console.log('All required permissions granted');
        } else {
          console.log('Not all required permissions granted');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    }
    this.setState({
      disableplay: true,
      disablepause: false,
      disablestop: false,
      disableplaypause: true,
      disableupload: true,
    });
    const audioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
      OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
    };

    this.setState({wave: []});

    console.log('audioSet', audioSet);
    const meteringEnabled = true;
    const uri = await this.audioRecorderPlayer.startRecorder(
      this.path,
      audioSet,
      meteringEnabled,
    );
    this.audioRecorderPlayer.addRecordBackListener(e => {
      console.log('record-back', e);
      console.log(this.state.wave);

      this.setState({
        recordSecs: e.currentPosition,

        currentDB: e.currentMetering,
      });

      const newWaveValue = this.state.currentDB;
      if (this.state.recordSecs === 20000 || this.state.recordSecs >= 20000) {
        this.onStopRecord();
      }
      this.setState(prevState => ({
        wave: [...prevState.wave, newWaveValue],
      }));
    });
    console.log(`uri: ${uri}`);
  };

  onPauseRecord = async () => {
    try {
      const r = await this.audioRecorderPlayer.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }

    this.setState({disablepause: true});
  };

  onResumeRecord = async () => {
    await this.audioRecorderPlayer.resumeRecorder();
    this.setState({disableplay: true, disablepause: false});
  };

  onRetakeRecord = async () => {
    this.onStopRecord();
    this.onStartRecord();
  };

  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();

    const recordedDuration = this.audioRecorderPlayer.mmssss(
      Math.floor(this.state.recordSecs),
    );
    this.setState(prevState => ({
      progressbarwidth: prevState.recordSecs,
    }));

    this.setState(prevState => ({
      recordSecs: 0,
      playTime: '00:00:00',
      duration: recordedDuration,
      disableplay: false,
      disablepause: true,
      disablestop: true,
      disableplaypause: true,
      disableupload: false,
    }));
    console.log(result);
  };

  onStartPlay = async () => {
    console.log('onStartPlay', this.path);

    try {
      const msg = await this.audioRecorderPlayer.startPlayer(this.path);
      this.setState({msg});
      //? Default path
      // const msg = await this.audioRecorderPlayer.startPlayer();
      const volume = await this.audioRecorderPlayer.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      this.audioRecorderPlayer.addPlayBackListener(e => {
        console.log('playBackListener', e.currentPosition);
        this.setState({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          currentMeteringSec: e.currentMetering,
          playTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
          duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
          disableplaypause: false,
        });
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  onPausePlay = async () => {
    try {
      await this.audioRecorderPlayer.pausePlayer();
      this.setState({disableplaypause: true});
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  onResumePlay = async () => {
    try {
      await this.audioRecorderPlayer.startPlayer(this.path);
      this.setState({disableplaypause: false});
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  onStopPlay = async () => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
    this.setState({playTime: '00:00:00', currentPositionSec: 0}); // Reset playTime)
  };
}

export default MainPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
  },

  container2: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecorder: {
    width: '100%',
  },
  recordBtnWrapper: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  viewPlayer: {
    marginTop: verticalScale(17),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: verticalScale(17),
    marginHorizontal: scale(28),
    width: moderateScale(242.89),
  },
  viewBar: {
    backgroundColor: 'black',
    height: verticalScale(4),
    alignSelf: 'stretch',
    width: moderateScale(242.89),
  },
  viewBarPlay: {
    backgroundColor: 'red',
    height: verticalScale(4),
    width: scale(0),
  },

  recordbtn: {
    borderColor: 'white',
    borderWidth: scale(3),
    backgroundColor: 'red',
    height: verticalScale(45),
    width: verticalScale(45),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
  },
  savebtn: {
    borderColor: 'white',
    borderWidth: scale(1),
    backgroundColor: 'white',
    height: verticalScale(45),
    width: verticalScale(45),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbtn: {
    borderColor: 'grey',
    borderWidth: scale(1),
    backgroundColor: 'blue',
    height: verticalScale(45),
    width: verticalScale(45),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
  },

  txt: {
    color: 'black',
    fontSize: scale(14),
    marginHorizontal: scale(8),
    marginVertical: verticalScale(4),
  },

  txtRecordCounter: {
    marginTop: verticalScale(5),
    color: 'red',
    fontSize: scale(15),
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: scale(3),
  },
  playaudio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  uploadbtn: {
    width: moderateScale(200),
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(27),
    borderRadius: scale(6),
    marginTop: verticalScale(40),
  },
  uploadtxt: {
    color: 'white',
    padding: moderateScale(6),
    fontSize: scale(13),
    textAlign: 'center',
  },
});
