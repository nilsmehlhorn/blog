import Layout from '../components/layout'
import SEO from '../components/seo'
import Img from 'gatsby-image'
import React from 'react'
import {graphql} from 'gatsby'
import {classes} from '../util/classes'

import styles from './talks.module.scss'
import Location from '../components/location'

const TalksPage = ({
                     data: {
                       talks: {edges: talks}
                     }
                   }) => {
  const Talks = talks
    .map(({node: {talk}}) => <div className={styles.talk}>
      <a href={talk.link}>
        <Img className={styles.banner} fluid={talk.img.preview.fluid}/>
      </a>
      <div className={styles.content}>
        <h2 className={styles.name}>{talk.name}</h2>
        <div className={styles.sub}>
          <p className="date">{talk.date}</p>
          <Location>{talk.location}</Location>
        </div>
        <p className={styles.description}>{talk.description}</p>
      </div>
    </div>)
  return <Layout>
    <SEO key={'seo'} title={'Blog'} keywords={['talk', 'public speaking', 'angular', 'javascript', 'nodejs', 'nativescript']}/>
    <div className={classes('content-padding', styles.talks)}>
      {Talks}
    </div>
  </Layout>
}
export default TalksPage

export const pageQuery = graphql`
  query {
    talks: allTalksYaml {
      edges {
        node {
          id
          talk {
            name
            link
            date(formatString: "MMMM DD, YYYY")
            location
            description
            img {
              preview: childImageSharp {
                fluid(maxHeight: 480, quality: 100) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    }
  }
`
