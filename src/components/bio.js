import React from 'react'
import {StaticQuery, graphql} from 'gatsby'
import Img from 'gatsby-image'
import {FaTwitter, FaInstagram, FaGithub} from 'react-icons/fa'
import {MdLocationOn} from 'react-icons/md'

import styles from './bio.module.scss'
import {GoMailRead} from 'react-icons/all'

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
            <div className={styles.icons}>
              <span className={styles.location}>
                <MdLocationOn className={styles.locationIcon} size={32}/>
                Essen, Germany
              </span>
              <a title='Nils Mehlhorn on Twitter' href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
              <a title='Nils Mehlhorn on Instagram' href="https://www.instagram.com/n_mehlhorn"><FaInstagram size={32}/></a>
              <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
              <button className={styles.link} title='Nils Mehlhorn Newsletter' onClick={() => window.ml_webform_1483080('show')}>
                <GoMailRead size={32}/>
              </button>
            </div>
          </section>
        </div>
      </section>
    )}
  />
)

export default Bio
