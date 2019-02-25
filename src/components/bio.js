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
          This is a space where I'll explore any topic I just can't keep my mouth shut about. I'm mostly doing
          web development, but here we'll wander off into any direction that seems interesting. Enjoy the ride!
        </p>
      </section>
    )}
  />
)

export default Bio