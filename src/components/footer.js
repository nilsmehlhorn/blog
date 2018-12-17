import {graphql, StaticQuery} from 'gatsby'
import React from 'react'
import {FaTwitter, FaGithub} from 'react-icons/fa'

import styles from './footer.module.scss'

const Footer = () => (
  <StaticQuery
    query={graphql`
      query FooterQuery {
        img: file(relativePath: { eq: "icon.png" }) {
          childImageSharp {
            fixed(width: 92, height: 92) {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `}
    render={data => (
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.links}>
            <a href="https://twitter.com/n_mehlhorn"><FaTwitter/></a>
            <a href="https://github.com/nilsmehlhorn"><FaGithub/></a>
          </div>
          <small className={styles.copyright}>Nils Mehlhorn &copy; 2018</small>
          <small className={styles.iconCredits}>
            Logo made by <a href="https://www.freepik.com/" title="Freepik">Freepik</a>, licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0"
                              target="_blank" rel="noopener noreferrer">CC 3.0 BY</a></small>
        </div>
      </footer>
    )}
  />
)

export default Footer