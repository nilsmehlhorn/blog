import React from 'react'
import {FaGithub, FaTwitter, FaInstagram, FaDev} from 'react-icons/fa'
import {GoMailRead} from 'react-icons/go'

import styles from './footer.module.scss'
/* eslint-disable */
const Footer = () => (
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.links}>
            <a title='Nils Mehlhorn on Twitter' href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
            <a title='Nils Mehlhorn on Instagram' href="https://www.instagram.com/nils_mehlhorn"><FaInstagram size={32}/></a>
            <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
            <a title='Nils Mehlhorn on DEV' href="https://dev.to/n_mehlhorn"><FaDev size={32}/></a>
            <a title='Nils Mehlhorn Newsletter' href="javascript:" onClick={() => window.ml_webform_1483080('show')}>
              <GoMailRead size={32}/>
            </a>
          </div>
          <small className={styles.copyright}>Nils Mehlhorn &copy; 2019</small>
          <small className={styles.iconCredits}>
            Logo by <a href="https://www.freepik.com/" title="Freepik">Freepik</a>, licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0"
                              target="_blank" rel="noopener noreferrer">CC 3.0 BY</a></small>
        </div>
      </footer>
)
/* eslint-enable */

export default Footer
