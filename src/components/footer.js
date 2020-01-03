import React from 'react'
import {FaDev, FaGithub, FaLinkedin, FaRss, FaTwitter} from 'react-icons/fa'
import {GoMailRead} from 'react-icons/go'
import {Link} from 'gatsby'

import styles from './footer.module.scss'
/* eslint-disable */
const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.content}>
      <div className={styles.links}>
        <a title='Nils Mehlhorn on Twitter' href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
        <a title='Nils Mehlhorn on LinkedIn' href="https://www.linkedin.com/in/nils-mehlhorn/"><FaLinkedin
          size={32}/></a>
        <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
        <a title='Nils Mehlhorn on DEV' href="https://dev.to/n_mehlhorn"><FaDev size={32}/></a>
        <a title='Nils Mehlhorn via RSS' href="https://nils-mehlhorn.de/rss.xml"><FaRss size={32}/></a>
        <Link to={'/newsletter'} title='Nils Mehlhorn Newsletter' href="https://nils-mehlhorn.de/rss.xml">
          <GoMailRead size={32}/>
        </Link>
      </div>
      <small className={styles.copyright}>Nils Mehlhorn &copy; 2019</small>
      <small>
        <Link className={styles.smallLink} to='/imprint'>Imprint</Link>
        <Link className={styles.smallLink} to='/privacy'>Privacy</Link>
      </small>
    </div>
  </footer>
)
/* eslint-enable */

export default Footer
