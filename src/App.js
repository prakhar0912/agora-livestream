import { useState } from 'react'
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


  let init = (name, sRole) => {
    client.init('26ec1c7ca4044efc8b2631858ba9eb35', () => {
      joinChannel(name, sRole)
    }, (err) => { console.log(err) });
  }


  let joinChannel = (channelName, sRole) => {
    client.setClientRole(sRole);
    client.join(null, channelName, null, (uid) => {
      if (sRole === 'host') {
        createCameraStream(uid, {});
        console.log(uid)
        setLocal({ ...local, uid: uid })
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
    localStream.on("accessAllowed", function () {

    });
    console.log('here')
    localStream.init(() => {
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
      if (role !== 'host') {
        let stream = evt.stream;
        client.subscribe(stream, (err) => { console.log(err) });
      }
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
      setStart(false)
    });

    client.on('peer-leave', (e) => {
      let stream = e.stream
      stream.stop()
      stream.close()
      setStart(false)
    })
  }

  const leaveChannel = () => {
    client.leave((evt) => {
      if (role === 'host') {
        local.camera.stream.stop()
        local.camera.stream.close();
        client.unpublish(local.camera.stream);
        setStart(false)
      }
    }, (err) => { console.error(err) });
  }

  return (
    <div className="App">
      {start && <Video setStart={setStart} local={local} quit={leaveChannel} role={role} />}
      {!start && <ChannelForm start={setStart} init={init} setRole={setRole} />}
    </div>
  );
}

const ChannelForm = ({ start, init, setRole }) => {

  const [channelName, setChannelName] = useState('')
  return (
    <form className='join'>
      <input type="text" placeholder='Enter Channel Name' onChange={(e) => setChannelName(e.target.value)} />
      <button onClick={(e) => { e.preventDefault(); setRole('host'); start(true); init(channelName, 'host'); }}>Create Livestream</button>
      <button onClick={(e) => { e.preventDefault(); setRole('audience'); start(true); init(channelName, 'audience'); }}>Join Livestream</button>
    </form>
  );
}



const Video = ({ setStart, local, quit, role }) => {
  return (
    <div id='video'>
      <Controls setStart={setStart} local={local} quit={quit} role={role} />
    </div>
  )
}

const Controls = ({ setStart, local, quit, role }) => {

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
      {role === 'host' && <p className={audio ? 'on' : ''} onClick={() => toggleMic()}>Mic</p>}
      {role === 'host' && <p className={video ? 'on' : ''} onClick={() => toggleVideo()}>Video</p>}
      <p onClick={() => { quit(); setStart(false) }}>Quit</p>
    </div>
  )
}



export default App;
