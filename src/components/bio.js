import React from 'react'
import {graphql, StaticQuery} from 'gatsby'
import Img from 'gatsby-image'
import {FaGithub, FaLinkedin, FaTwitter} from 'react-icons/fa'

import styles from './bio.module.scss'
import {classes} from '../util/classes'
import Location from './location'

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
              ...GatsbyImageSharpFixed_withWebp
            }
          }
        }
      }
    `}
    render={({mug, site}) => {
      const intro = short ? null : <p className={styles.introduction}>
        I help companies develop sophisticated and maintainable software solutions. A major focus
        of mine are web technologies with languages such as JavaScript, TypeScript and Java used with frameworks like
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
                <a title='Nils Mehlhorn on LinkedIn' href="https://www.linkedin.com/in/nils-mehlhorn/"><FaLinkedin
                  size={32}/></a>
                <a title='Nils Mehlhorn on GitHub' href="https://github.com/nilsmehlhorn"><FaGithub size={32}/></a>
              </div>
            </section>
          </div>
        </section>
      )
    }}
  />
)

export default Bio
