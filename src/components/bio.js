import React from 'react'
import {graphql, StaticQuery} from 'gatsby'
import Img from 'gatsby-image'
import Location from './location'
import {FaGithub, FaInstagram, FaTwitter} from 'react-icons/fa'

import styles from './bio.module.scss'
import {GoMailRead} from 'react-icons/all'
import {classes} from '../util/classes'

const Bio = ({short, className}) => (
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
    render={({mug, site}) => {
      const intro = short ? null : <p className={styles.introduction}>
        I help companies develop sophisticated and maintainable software solutions. A major technological focus
        for me are web technologies with languages such JavaScript, TypeScript and Java used with frameworks like
        Angular and Spring.
      </p>
      return (
        <section className={classes(styles.bio, className)}>
          <div className={styles.hero}>
            <Img className={styles.mug} fixed={mug.childImageSharp.fixed}/>
            <section className={styles.greeting}>
              <h1>Hi, I'm Nils</h1>
              <h2>{site.siteMetadata.description}</h2>
              {intro}
              <div className={styles.icons}>
                <Location>Essen, Germany</Location>
                <a title='Nils Mehlhorn on Twitter' href="https://twitter.com/n_mehlhorn"><FaTwitter size={32}/></a>
                <a title='Nils Mehlhorn on Instagram' href="https://www.instagram.com/n_mehlhorn"><FaInstagram
                  size={32}/></a>
                <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
                <button className={styles.link} title='Nils Mehlhorn Newsletter'
                        onClick={() => window.ml_webform_1483080('show')}>
                  <GoMailRead size={32}/>
                </button>
              </div>
            </section>
          </div>
        </section>
      )
    }}
  />
)

export default Bio
