import React from 'react';
// import logo from './logo.svg';
import './App.css';
// import VideoPlayer from './components/VideoPlayer_v1';
import VideoPlayerV2 from './components/VideoPlayer_v2';

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <VideoPlayerV2 
          url='https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' 
          hlsConfig={{
            enableWorker: false
          }}
          videoProps={{
            muted: true
          }} />
    </div>
  );
}

export default App;
