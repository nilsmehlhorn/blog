import React from 'react'
import {StaticQuery, graphql} from 'gatsby'
import Img from 'gatsby-image'
import {FaTwitter} from 'react-icons/fa'

import styles from './bio.module.scss'

const Bio = () => (
  <StaticQuery
    query={graphql`
      query BioQuery {
        mug: file(relativePath: { eq: "mug_sm_w.jpg" }) {
          childImageSharp {
            fluid(maxWidth: 92, maxHeight: 92) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    `}
    render={({mug}) => (
      <section className={styles.bio}>
        <header className={styles.header}>
          <Img className={styles.mug} fluid={mug.childImageSharp.fluid}/>
          <div className={styles.info}>
            <h4 className={styles.greeting}>Nils Mehlhorn</h4>
            <a href="https://twitter.com/n_mehlhorn" className={styles.twitterButton}>
              <FaTwitter size={14} color={'white'} className={styles.twitterIcon}/>Follow @n_mehlhorn
            </a>
          </div>
        </header>
        <p>
          This is a space where I'll explore any topic I just can't keep my mouth shut about. I'm mostly doing
          web development, but here we'll wander off into any direction that seems interesting.
        </p>
        <p>Enjoy the ride!</p>
      </section>
    )}
  />
)

export default Bio