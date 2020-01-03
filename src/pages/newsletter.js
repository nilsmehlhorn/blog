import Layout from '../components/layout'
import SEO from '../components/seo'
import React from 'react'
import {graphql} from 'gatsby'
import Img from 'gatsby-image'
import styles from './newsletter.module.scss'
import {classes} from '../util/classes'

const NewsletterPage = ({data}) => {
  const {newsletter} = data
  const desc = 'Newsletter on web technologies like Angular, Spring, Node.js as well as product building and agile development processes.'
  return <Layout>
    <SEO description={desc} key={'seo'} title={'Newsletter'}
         keywords={['consulting', 'angular', 'javascript', 'nodejs', 'nativescript']}/>
    <div className="content-padding">
      <div id={'test'} className={styles.newsletterCta}>
        <div className={classes('ml-form-embed', styles.newsletterForm)}
             data-account="1661492:z6v6l1q6j9"
             data-form="1496676:r3w8j1">
        </div>
        <Img className={styles.newsletterImg} fluid={newsletter.childImageSharp.fluid}/>
      </div>
    </div>
  </Layout>
}
export default NewsletterPage

export const pageQuery = graphql`
  query {
    newsletter: file(relativePath: { eq: "newsletter_background.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 964, quality: 100) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`
