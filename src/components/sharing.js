import React from 'react'
import {FaFacebook, FaHackerNews, FaTwitter} from 'react-icons/fa'

import styles from './sharing.module.scss'

const openTwitter = () => {
  window.open(this.href, 'twitter-share', 'width=550,height=235')
  return false
}

const openHn = () => {
  window.open(this.href, 'hn-share', 'width=550,height=350')
  return false
}

const openFb = () => {
  window.open(this.href, 'facebook-share', 'width=580,height=296')
  return false
}

const Sharing = ({url, title}) => {
  const twitterParams = {text: `${title} via @n_mehlhorn`, url}
  const twitterShare = `https://twitter.com/share?${new URLSearchParams(twitterParams).toString()}`
  const hnParams = {u: url, t: title}
  const hnShare = `https://news.ycombinator.com/submitlink?${new URLSearchParams(hnParams).toString()}`
  const fbParams = {u: url}
  const fbShare = `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams(fbParams).toString()}`
  return <ul className={styles.sharing}>
    <li>
      <a href={twitterShare}
         onClick={openTwitter}>
        <i><FaTwitter size={16}/></i>
        <span>Share on Twitter</span>
      </a>
    </li>
    <li>
      <a href={hnShare}
         onClick={openHn}>
        <i><FaHackerNews size={16}/></i>
        <span>Share on Hacker News</span>
      </a>
    </li>
    <li>
      <a href={fbShare}
         onClick={openFb}>
        <i><FaFacebook size={16}/></i>
        <span>Share on Facebook</span>
      </a>
    </li>
  </ul>
}

export default Sharing
