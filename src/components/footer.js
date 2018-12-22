import React from 'react'
import {FaGithub, FaTwitter} from 'react-icons/fa'

import styles from './footer.module.scss'

const Footer = () => (
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.links}>
            <a href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
            <a href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
          </div>
          <small className={styles.copyright}>Nils Mehlhorn &copy; 2018</small>
          <small className={styles.iconCredits}>
            Logo by <a href="https://www.freepik.com/" title="Freepik">Freepik</a>, licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0"
                              target="_blank" rel="noopener noreferrer">CC 3.0 BY</a></small>
        </div>
      </footer>
)

export default Footer