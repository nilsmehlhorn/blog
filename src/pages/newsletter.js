import Layout from '../components/layout'
import SEO from '../components/seo'
import React from 'react'
import {graphql} from 'gatsby'
import Img from 'gatsby-image'
import styles from './newsletter.module.scss'

const NewsletterPage = ({data}) => {
  const {newsletter} = data
  const desc = 'Newsletter on web technologies like Angular, Spring, Node.js as well as product building and agile development processes.'
  return <Layout>
    <SEO description={desc} key={'seo'} title={'Newsletter'} noMailSignup={true}
         keywords={['consulting', 'angular', 'javascript', 'nodejs', 'nativescript']}/>
    <div className={styles.content}>
      <div id={'test'} className={styles.newsletterCta}>
        <div className='ml-form-embed'
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
