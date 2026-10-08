import React, { useEffect, useState } from 'react';

// The lesson's video, played on the page. It first shows the video's still
// frame with a play button and loads the YouTube player only when pressed, so
// lesson pages stay fast. The box keeps a 16:9 shape at every screen width.
// `videoId` arrives with the lesson itself, so it is only known to learners
// who can open the lesson.
export default function LessonVideo({ videoId: id, title }) {
  const [playing, setPlaying] = useState(false), [sharp, setSharp] = useState(true);
  useEffect(() => { setPlaying(false); setSharp(true); }, [id]);
  if (!id) return null;
  return <figure className="lesson-video">
    <div className="lesson-video-frame">
      {playing
        ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`} title={`Video: ${title}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        : <button className="lesson-video-poster" onClick={() => setPlaying(true)} aria-label={`Play the video for ${title}`}>
            <img src={`https://i.ytimg.com/vi/${id}/${sharp ? 'maxresdefault' : 'mqdefault'}.jpg`} alt="" loading="lazy" onError={() => setSharp(false)} onLoad={e => { if (sharp && e.currentTarget.naturalWidth < 320) setSharp(false); }}/>
            <span className="lesson-video-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
          </button>}
    </div>
    <figcaption>Video lesson · {title}</figcaption>
  </figure>;
}
