import { useState, useEffect } from 'react'
import AgoraRTC from "agora-rtc-sdk"
// import 'https://download.agora.io/sdk/release/AgoraRTC_N-4.2.1.js'


let App = () => {

  const [start, setStart] = useState(false)
  const [role, setRole] = useState('host')


  let client = AgoraRTC.createClient({
    mode: 'live',
    codec: 'vp8'
  })


  const [local, setLocal] = useState({
    uid: '',
    camera: {
      camId: '',
      micId: '',
      stream: {}
    }
  })


  let init = (name) => {
    client.init('26ec1c7ca4044efc8b2631858ba9eb35', () => {
      joinChannel(name, role)
    }, (err) => { console.log(err) });
  }


  function joinChannel(channelName) {
    client.setClientRole(role);
    client.join(null, channelName, null, (uid) => {
      if (role === 'host') {
        createCameraStream(uid, {});
        console.log(uid)
        setLocal({ ...local, uid: uid })
      }
    }, (err) => { console.error(err) });
  }


  let createCameraStream = (uid, deviceIds) => {
    let localStream = AgoraRTC.createStream({
      streamID: uid,
      audio: true,
      video: true,
      screen: false
    });
    localStream.setVideoProfile('720p_6');
    localStream.on("accessAllowed", function () {

    });
    console.log('here')
    localStream.init(() => {
      console.log('cllo')
      localStream.play('video')
      client.publish(localStream, (err) => { console.error(err) })
      // localStreams.camera.stream = localStream
      setLocal({ ...local, camera: { ...local.camera, stream: localStream } })
      // console.log('localStream', localStreams)
      streamEventsInit()
    }, (err) => { console.err(err) })
  }

  let streamEventsInit = () => {
    client.on('stream-added', (evt) => {
      let stream = evt.stream;
      client.subscribe(stream, (err) => { console.log(err) });
    });


    client.on('stream-subscribed', function (evt) {
      let remoteStream = evt.stream;
      let remoteId = remoteStream.getId();
      console.log("Subscribe remote stream successfully: " + remoteId);
      remoteStream.play('video');
    });


    client.on('stream-removed', (evt) => {
      let stream = evt.stream;
      stream.stop();
      stream.close();
    });

    client.on('peer-leave', (e) => {
      let stream = e.stream
      stream.stop()
      stream.close()
      setStart(false)
    })
  }

  const leaveChannel = () => {
    client.leave(() => {
      if (role === 'host') {
        local.camera.stream.stop()
        local.camera.stream.close();
        client.unpublish(local.camera.stream);
      }
      setStart(false)
    }, (err) => { console.error(err) });
  }

  return (
    <div className="App">
      {start && <Video setStart={setStart} local={local} quit={leaveChannel} />}
      {!start && <ChannelForm start={setStart} init={init} setRole={setRole} />}
    </div>
  );
}

const ChannelForm = ({ start, init, setRole }) => {

  const [channelName, setChannelName] = useState('')

  return (
    <form className='join'>
      <input type="text" placeholder='Enter Channel Name' onChange={(e) => setChannelName(e.target.value)} />
      <button onClick={(e) => { e.preventDefault(); start(true); init(channelName); setRole('host') }}>Create Livestream</button>
      <button onClick={(e) => { e.preventDefault(); start(true); init(channelName); setRole('audience') }}>Join Livestream</button>
    </form>
  );
}



const Video = ({ setStart, local, quit }) => {
  return (
    <div id='video'>
      <Controls setStart={setStart} local={local} quit={quit} />
    </div>
  )
}

const Controls = ({ setStart, local, quit }) => {

  const [audio, setAudio] = useState(true)
  const [video, setVideo] = useState(true)

  const toggleMic = () => {
    console.log(local)
    audio ? local.camera.stream.muteAudio() : local.camera.stream.unmuteAudio()
    setAudio(!audio)
  }

  const toggleVideo = () => {
    video ? local.camera.stream.muteVideo() : local.camera.stream.unmuteVideo()
    setVideo(!video)
  }




  return (
    <div className='controls'>
      <p className={audio ? 'on' : ''} onClick={() => toggleMic()}>Mic</p>
      <p className={video ? 'on' : ''} onClick={() => toggleVideo()}>Video</p>
      <p onClick={() => { quit(); setStart(false) }}>Quit</p>
    </div>
  )
}



export default App;
