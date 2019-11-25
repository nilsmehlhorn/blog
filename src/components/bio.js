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
            fixed(width: 196, quality: 100) {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `}
    render={({mug}) => (
      <section className={styles.bio}>
        <Img className={styles.mug} fixed={mug.childImageSharp.fixed}/>
      </section>
    )}
  />
)

export default Bio
