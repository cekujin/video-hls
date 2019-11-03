import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Hls from 'hls.js';

// Formula for getting file size = (bitrate x length) / 8

// To get the total nb of bytes use FRAG_LOADED event:
// - data.stats.total

export class VideoPlayerV2 extends Component {
    constructor(props) {
        super(props);

        this.state = {
            playerId: Date.now(),
            unsupported: false,
            loading: true,
            play: props.autoPlay,
            waiting: false,
            subtitles: [],
            qualities: []
        }

        this.hls = null;
        this.video = React.createRef();
        this.initPlayer = this.initPlayer.bind(this);
    }

    componentDidMount() {
        if (Hls.isSupported()) {
            this.initPlayer();
            this.setState({ loading: false });
        }
        else if (this.video.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Check if browser has built-in HLS Support
            let { url } = this.props;
            this.video.current.src = url;
            // TODO: find a place for this listener
            this.video.current.addEventListener('loadedmetadata', () => {
                this.video.current.play();
            });

            this.setState({ loading: false });
        }
        else {
            this.setState({ unsupported: true, loading: false });
        }
    }

    componentWillUnmount() {
        if (this.hls) {
            this.hls.destroy();
        }
    }

    initPlayer() {
        if (this.hls) {
            this.hls.destroy();
        }

        let { url, autoPlay, hlsConfig } = this.props;
        let hls = new Hls(hlsConfig);
        let self = this;

        hls.attachMedia(this.video.current);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(url);

            hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
                // Get available quality levels from parsed manifest
                console.log(data.levels);
                let qualities = data.levels.map(level => {
                    return {
                        resolution: level.height
                    }
                });

                self.setState({ qualities: data.levels });

                if (autoPlay) {
                    self.video.current.play();
                }

                console.log(hls.currentLevel);
            });

            hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
                this.setState({ subtitles: hls.subtitleTracks });
            });

            hls.on(Hls.Events.FRAG_LOADED, function (event, data) {
                // console.log(data);
            });
        });
        

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.log(data);
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        self.initPlayer();
                        break;
                }
            }
        });

        this.hls = hls;
    }

    //#region ================== EVENTS ==================
    // TODO:
    //  [x] - Get duration 
    //  [x] - Get buffered
    //  [ ] - Get network bytes
    //  [x] - Play event
    //  [x] - Pause event
    //  [ ] - Seek event
    //  [ ] - loading and changing subtitles
    //  [ ] - changing video quality

    handleProgress = () => {
        let { duration, currentTime, buffered } =  this.video.current;
        let secondsLoaded = 0;

        // on iOS, live streams return Infinity for the duration
        // so instead we use the end of the seekable timerange
        if (duration === Infinity && buffered.length > 0 ) {
            duration = buffered.end(buffered.length - 1);
        }

        if (buffered.length > 0) {
            secondsLoaded = buffered.end(buffered.length - 1);
        }

        this.setState({ duration, currentTime, secondsLoaded });
    }

    seekTo = (time) => {
        if (!this.video) return;
        this.video.current.currentTime = time;
    }

    handlePlay = () => {
        this.video.current.play();
    }

    handlePause = () => {
        this.video.current.pause();
    }

    handlePlayback = e => {
        const { value } = e.currentTarget;
        const { currentTime } = this.video.current;
        const seekTo = currentTime + parseInt(value);
        
        if (seekTo < 0) {
            this.seekTo(0);
        }
        else {
            this.seekTo(seekTo);
        }
    }
    
    handleChangeSubtitle = e => {
        this.hls.subtitleTrack = e.currentTarget.value;
    }

    handleQualityChange = e => {
        this.hls.currentLevel = e.currentTarget.value;

    }
    //#endregion

    render() {
        let { playerId, unsupported, loading, duration, currentTime, secondsLoaded, subtitles, qualities } = this.state;
        const { controls, width, height, poster, videoProps } = this.props;
        
        if (loading) {
            // Return loading animation
        }
        else {
            if (unsupported) {
                // Return error screen: Browser does not support MediaSource Extensions
            }
        }

        return (
            <div key={playerId}>
                <video 
                    ref={this.video} 
                    className="hls-player" 
                    id={`video-hls-${playerId}`} 
                    controls={controls}
                    width={width} 
                    height={height} 
                    poster={poster}
                    onProgress={this.handleProgress}
                    {...videoProps}>
                </video>

                <div>
                    <button value={-15} onClick={this.handlePlayback}>-15</button>
                    <button onClick={this.handlePlay}>Play</button>
                    <button onClick={this.handlePause}>Pause</button>
                    <button value={15} onClick={this.handlePlayback}>+15</button>
                </div>
                <table>
                    <tbody>
                        <tr>
                            <td>Played:</td>
                            <td>{currentTime}</td>
                        </tr>
                        <tr>
                            <td>Duration:</td>
                            <td>{duration}</td>
                        </tr>
                        <tr>
                            <td>Buffered:</td>
                            <td>{secondsLoaded}</td>
                        </tr>
                        <tr>
                            <td>Subtitles:</td>
                            <td>
                                <select onChange={this.handleChangeSubtitle}>
                                    {
                                        subtitles.map(sub => <option key={sub.name} value={sub.id} selected={sub.default}>{sub.name}</option>)
                                    }
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Quality:</td>
                            <td>
                                <select onChange={this.handleQualityChange}>
                                    {
                                        qualities.map((q, index) => {
                                            if ('level' in q) {
                                                return (
                                                    <option key={`qt_${index}`} value={q.level}>{q.attrs.RESOLUTION}</option>
                                                )
                                            }
                                        })
                                    }
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

VideoPlayerV2.propTypes = {
    url: PropTypes.string.isRequired,
    autoPlay: PropTypes.bool,
    hlsConfig: PropTypes.object,
    controls: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    poster: PropTypes.string,
    videoProps: PropTypes.object
}

VideoPlayerV2.defaultProps = {
    autoPlay: false,
    hlsConfig: {},
    controls: true,
    width: 500,
    height: 375
}

export default VideoPlayerV2;