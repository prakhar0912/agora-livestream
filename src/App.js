import { useState, useRef } from 'react'
import AgoraRTC from "agora-rtc-sdk"

let App = () => {

  const [start, setStart] = useState(false)
  const role = useRef('host')
  let client = AgoraRTC.createClient({
    mode: 'live',
    codec: 'vp8'
  })
  const local = useRef({
    uid: '',
    camera: {
      camId: '',
      micId: '',
      stream: {}
    }
  })


  let init = (name, Role) => {
    role.current = Role
    setStart(true);
    client.init('26ec1c7ca4044efc8b2631858ba9eb35', () => {
      streamEventsInit()
      joinChannel(name)
    }, (err) => { console.log(err) });
  }


  let joinChannel = (channelName) => {
    client.setClientRole(role.current);
    client.join(null, channelName, null, (uid) => {
      if (role.current === 'host') {
        createCameraStream(uid);
        local.current.uid = uid
      }
      else {
        streamEventsInit()
      }
    }, (err) => { console.error(err) });
  }


  let createCameraStream = (uid) => {
    let localStream = AgoraRTC.createStream({
      streamID: uid,
      audio: true,
      video: true,
      screen: false
    });
    localStream.setVideoProfile('720p_6');
    localStream.on("accessAllowed", () => {});
    localStream.init(() => {
      localStream.play('video')
      client.publish(localStream, (err) => { console.error(err) })
      local.current.camera.stream = localStream
    }, (err) => { console.err(err) })
  }

  let streamEventsInit = () => {

    if (role.current !== 'host') {
      client.on('stream-added', (evt) => {
        let stream = evt.stream;
        client.subscribe(stream, (err) => { console.log(err) });
      });
      client.on('stream-removed', (evt) => {
        let stream = evt.stream;
        stream.stop();
        stream.close();
        setStart(false)
      });
    }

    client.on('stream-subscribed', function (evt) {
      let remoteStream = evt.stream;
      let remoteId = remoteStream.getId();
      console.log("Subscribe remote stream successfully: " + remoteId);
      remoteStream.play('video');

    })
    // client.on('peer-leave', (e) => {
    //   console.log('hrre')
    //   let stream = e.stream
    //   stream.stop()
    //   stream.close()
    //   setStart(false)
    // })
  }

  const leaveChannel = () => {
    setStart(false)
    client.leave((evt) => {
      if (role.current === 'host') {
        local.current.camera.stream.stop()
        local.current.camera.stream.close();
        client.unpublish(local.current.camera.stream);
        setStart(false)
      }
    }, (err) => { console.error(err) });
  }

  return (
    <div className="App">
      {start && <Video local={local} quitFunc={leaveChannel} role={role} />}
      {!start && <ChannelForm initFunc={init}/>}
    </div>
  );
}

const ChannelForm = ({ initFunc }) => {

  const [channelName, setChannelName] = useState('')
  return (
    <form className='join'>
      <input type="text" placeholder='Enter Channel Name' onChange={(e) => setChannelName(e.target.value)} />
      <button onClick={(e) => { e.preventDefault(); initFunc(channelName, 'host'); }}>Create Livestream</button>
      <button onClick={(e) => { e.preventDefault(); initFunc(channelName, 'audience'); }}>Join Livestream</button>
    </form>
  );

}



const Video = ({ local, quitFunc, role }) => {

  return (
    <div id='video'>
      <Controls local={local} quitFunc={quitFunc} role={role} />
    </div>
  )
  
}

const Controls = ({ local, quitFunc, role }) => {

  const [audio, setAudio] = useState(true)
  const [video, setVideo] = useState(true)

  const toggleMic = () => {
    audio ? local.current.camera.stream.muteAudio() : local.current.camera.stream.unmuteAudio()
    setAudio(!audio)
  }

  const toggleVideo = () => {
    video ? local.current.camera.stream.muteVideo() : local.current.camera.stream.unmuteVideo()
    setVideo(!video)
  }


  return (
    <div className='controls'>
      {role.current === 'host' && <p className={audio ? 'on' : ''} onClick={() => toggleMic()}>Mic</p>}
      {role.current === 'host' && <p className={video ? 'on' : ''} onClick={() => toggleVideo()}>Video</p>}
      <p onClick = {() => quitFunc()}>Quit</p>
    </div>
  )
}



export default App;
