import React from 'react'
import {StaticQuery, graphql} from 'gatsby'
import Img from 'gatsby-image'
import {FaTwitter, FaInstagram} from 'react-icons/fa'

import styles from './bio.module.scss'

const Bio = () => (
  <StaticQuery
    query={graphql`
      query BioQuery {
        mug: file(relativePath: { eq: "proud_mug_extended_sqr.jpg" }) {
          childImageSharp {
            fixed(width: 96, quality: 100) {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `}
    render={({mug}) => (
      <section className={styles.bio}>
        <header className={styles.header}>
          <Img className={styles.mug} fixed={mug.childImageSharp.fixed}/>
          <div className={styles.info}>
            <h4 className={styles.greeting}>Nils Mehlhorn</h4>
            <a href="https://twitter.com/n_mehlhorn" className={styles.twitterButton}>
              <FaTwitter size={14} color={'white'} className={styles.twitterIcon}/>Follow on Twitter
            </a>
            <a href="https://www.instagram.com/nils_mehlhorn" className={styles.twitterButton}>
              <FaInstagram size={14} color={'white'} className={styles.twitterIcon}/>Follow on Instagram
            </a>
          </div>
        </header>
        <p className={styles.desc}>
          developer consultant and product developer writing about just that and everything in between
        </p>
      </section>
    )}
  />
)

export default Bio
