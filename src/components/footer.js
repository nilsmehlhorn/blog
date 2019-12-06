import React from 'react'
import {FaGithub, FaTwitter, FaInstagram, FaDev, FaRss} from 'react-icons/fa'
import {GoMailRead} from 'react-icons/go'

import styles from './footer.module.scss'
/* eslint-disable */
const Footer = () => (
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.links}>
            <a title='Nils Mehlhorn on Twitter' href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
            <a title='Nils Mehlhorn on Instagram' href="https://www.instagram.com/n_mehlhorn"><FaInstagram size={32}/></a>
            <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
            <a title='Nils Mehlhorn on DEV' href="https://dev.to/n_mehlhorn"><FaDev size={32}/></a>
            <a title='Nils Mehlhorn via RSS' href="https://nils-mehlhorn.de/rss.xml"><FaRss size={32}/></a>
            <button className={styles.link} title='Nils Mehlhorn Newsletter' onClick={() => window.ml_webform_1483080('show')}>
              <GoMailRead size={32}/>
            </button>
          </div>
          <small className={styles.copyright}>Nils Mehlhorn &copy; 2019</small>
        </div>
      </footer>
)
/* eslint-enable */

export default Footer
