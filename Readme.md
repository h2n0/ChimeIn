![ChimeIn](public/assets/icons/128/128.png)

## About
[ChimeIn](https://chimein.live) is an app that allows users to add songs to a Spotify queue from any device, useful for parties and social gatherings of any size. Just connect and play.

#### Edit
Spotify is working on their own group implementation and it seems to nearly be ready so this project is no longer being worked on.

## Technology
- [JS (node / express)](index.js) - this manages the back end and user routing
- [Webmanifest](https://developers.google.com/web/fundamentals/web-app-manifest/) - This allows Android and iOS users running chrome to add the app to their home screen without going through the app store.
- [Spotify WebAPI and Connect SDK](https://developer.spotify.com/) - this is what allows us to work with Spotify. I have used [this implementation](https://github.com/thelinmichael/spotify-web-api-node) instead of writing my own, with the exception of some device calls.
