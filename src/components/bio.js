import React from 'react'
import {StaticQuery, graphql} from 'gatsby'
import Img from 'gatsby-image'
import {FaTwitter, FaInstagram} from 'react-icons/fa'

import styles from './bio.module.scss'

const Bio = () => (
  <StaticQuery
    query={graphql`
      query BioQuery {
        site {
          siteMetadata {
            description
          }
        }
        mug: file(relativePath: { eq: "proud_mug_extended_sqr.jpg" }) {
          childImageSharp {
            fixed(width: 196, quality: 100) {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `}
    render={({mug, site}) => (
      <section className={styles.bio}>
        <div className={styles.hero}>
          <Img className={styles.mug} fixed={mug.childImageSharp.fixed}/>
          <section className={styles.greeting}>
            <h1>Hi, I'm Nils</h1>
            <h2>{site.siteMetadata.description}</h2>
            <p className={styles.introduction}>
              I consult companies in developing sophisticated but also maintainable software solutions. One of my major focuses in technology is developing web applications using TypeScript and Java – specifically I’m skilled with Angular and Spring
            </p>
          </section>
        </div>
      </section>
    )}
  />
)

export default Bio
