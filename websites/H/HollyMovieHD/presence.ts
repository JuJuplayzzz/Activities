import { ActivityType, Assets, StatusDisplayType } from 'premid'

const presence = new Presence({
  clientId: '1527392816966402270',
})

interface VideoData {
  currentTime: number
  duration: number
  paused: boolean
}

let videoData: VideoData | null = null

presence.on('iFrameData', (data) => {
  videoData = data as VideoData
})

function toSquare(url: string): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=512&h=512&fit=contain&cbg=0000&output=png`
}

presence.on('UpdateData', async () => {
  const data: PresenceData = {
    type: ActivityType.Watching,
    name: 'a movie',
    statusDisplayType: StatusDisplayType.Details,
    largeImageKey: 'movie',
    largeImageText: 'HollyMovieHD',
  }

  const slug = decodeURIComponent(window.location.pathname.replace(/^\/|\/$/g, ''))
  const match = slug.match(/^(.+)[-_]((?:19|20)\d{2})$/)

  if (!match) {
    videoData = null
    data.details = 'Browsing movies'
    data.state = slug ? 'Looking around' : 'Homepage'
    presence.setActivity(data)
    return
  }

  const rawTitle = match[1] ?? ''
  const year = match[2] ?? ''

  data.details = rawTitle
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
  data.state = year

  const posterMatch = document.documentElement.innerHTML.match(
    /https:\/\/image\.tmdb\.org\/t\/p\/w342\/[\w-]+\.jpg/,
  )
  const fallback = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content

  if (posterMatch)
    data.largeImageKey = toSquare(posterMatch[0].replace('/w342/', '/w500/'))
  else if (fallback)
    data.largeImageKey = fallback

  if (videoData) {
    if (videoData.paused) {
      data.smallImageKey = Assets.Pause
      data.smallImageText = 'Paused'
    }
    else {
      [data.startTimestamp, data.endTimestamp] = presence.getTimestamps(
        videoData.currentTime,
        videoData.duration,
      )
      data.smallImageKey = Assets.Play
      data.smallImageText = 'Playing'
    }
  }

  presence.setActivity(data)
})
