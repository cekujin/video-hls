import React, { Component } from 'react';
import 'hls.js'

const IOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const MOVIE_FILE = 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4';
const PLAYBACK_RATE = 15;

export class VideoPlayer extends Component {
    state = {        
        muted: true,
        playsInline: true,
        playing: true
    }

    componentDidMount() {
        this.addListeners(this.player);
        if (IOS) {
            this.player.load();
        }
        // const { playing } = this.state;
        // if (this.player) {
        //     if (playing) {
        //         this.player.play();
        //     }
        // }
    }

    addListeners(player) {
        const { playsInline } = this.state;
        player.addEventListener('canplay', this.onReady)
        player.addEventListener('play', this.onPlay)
        player.addEventListener('waiting', this.onBuffer)
        player.addEventListener('playing', this.onBufferEnd)
        player.addEventListener('pause', this.onPause)
        player.addEventListener('seeked', this.onSeek)
        player.addEventListener('ended', this.onEnded)
        player.addEventListener('error', this.onError)
        player.addEventListener('enterpictureinpicture', this.onEnablePIP)
        player.addEventListener('leavepictureinpicture', this.onDisablePIP)
        player.addEventListener('webkitpresentationmodechanged', this.onPresentationModeChange)
        if (playsInline) {
            player.setAttribute('playsinline', '')
            player.setAttribute('webkit-playsinline', '')
            player.setAttribute('x5-playsinline', '')
        }
    }

    removeListeners (player) {
        player.removeEventListener('canplay', this.onReady)
        player.removeEventListener('play', this.onPlay)
        player.removeEventListener('waiting', this.onBuffer)
        player.removeEventListener('playing', this.onBufferEnd)
        player.removeEventListener('pause', this.onPause)
        player.removeEventListener('seeked', this.onSeek)
        player.removeEventListener('ended', this.onEnded)
        player.removeEventListener('error', this.onError)
        player.removeEventListener('enterpictureinpicture', this.onEnablePIP)
        player.removeEventListener('leavepictureinpicture', this.onDisablePIP)
        player.removeEventListener('webkitpresentationmodechanged', this.onPresentationModeChange)
    }

    handleContextMenu = (e) => {
        e.preventDefault();
    }

     // Proxy methods to prevent listener leaks
    onReady = (...args) => this.props.onReady(...args)
    onPlay = (...args) => this.props.onPlay(...args)
    onBuffer = (...args) => this.props.onBuffer(...args)
    onBufferEnd = (...args) => this.props.onBufferEnd(...args)
    onPause = (...args) => this.props.onPause(...args)
    onEnded = (...args) => this.props.onEnded(...args)
    onError = (...args) => this.props.onError(...args)
    onEnablePIP = (...args) => this.props.onEnablePIP(...args)

    getDuration = () => {
        if(!this.player) return null;

        const { duration, seekable } = this.player;
        // on iOS, live streams return Infinity for the duration
        // so instead we use the end of the seekable timerange
        if (duration === Infinity && seekable.length > 0) {
            return seekable.end(seekable.length - 1);
        }

        return duration;
    }

    getCurrentTime = () => {
        if (!this.player) return null;
        return this.player.currentTime;
    }
  
    getSecondsLoaded = () => {
        if (!this.player) return null;

        const { buffered } = this.player;

        if (buffered.length === 0) {
            return 0;
        }

        const end = buffered.end(buffered.length - 1);
        const duration = this.getDuration();
        if (end > duration) {
            return duration;
        }

        return end;
    }
  
    getInternalPlayer = (key = 'player') => {
        if (!this.player) return null;
        return this.player.getInternalPlayer(key);
    }

    ref = player => {
        this.player = player;
    }

    seekTo = (fraction) => {
        if (!this.player) return null;
        this.player.currentTime = fraction;
    }

    togglePlay = () => {
        let { playing } = this.state;

        this.setState({ playing: !playing }, () => {
            if (playing) {
                this.player.pause();
            }
            else {
                this.player.play();
            }
        });
    }

    handleProgress = () => {
        const duration = this.getDuration();
        const secondsLoaded = this.getSecondsLoaded();
        const currentTime = this.getCurrentTime();

        // console.log(`duration: ${duration}, secondsLoaded: ${secondsLoaded}, currentTime: ${currentTime}`);

        this.setState({ duration, secondsLoaded, currentTime });
    }

    handlePlayback = () => {
        const currentTime = this.getCurrentTime();

        const seekTo = currentTime - PLAYBACK_RATE; 

        if (seekTo < PLAYBACK_RATE) {
            this.seekTo(0);
        }
        else {
            this.seekTo(seekTo);
        }
    }

    handlePlayforward = () => {
        const duration = this.getDuration();
        const currentTime = this.getCurrentTime();

        const seekTo = currentTime + PLAYBACK_RATE;

        if (seekTo > duration) {
            this.seekTo(duration);
        }
        else {
            this.seekTo(seekTo);
        }
    }

    render() {
        const { playing, muted, duration, currentTime, secondsLoaded } = this.state;

        return (
            <React.Fragment>
                <div style={{height: 550, width: 550, margin: '0 auto'}}>
                    <video ref={this.ref}
                    src={MOVIE_FILE}
                    height="100%"
                    width="100%"
                    muted={muted}
                    autoPlay={playing}
                    onContextMenu={this.handleContextMenu}
                    onProgress={this.handleProgress}>
                    </video>
                </div>

                <div>Duration: {duration}</div>
                <div>Seconds loaded: {secondsLoaded}</div>
                <div>Current Time: {currentTime}</div>
                <div>
                    <button type="button" onClick={this.handlePlayback}>-15</button>
                    <button type="button" onClick={this.togglePlay}>{playing ? 'Pause' : 'Play'}</button>
                    <button type="button" onClick={this.handlePlayforward}>+15</button>
                </div>
            </React.Fragment>
        )
    }
}



export default VideoPlayer;
