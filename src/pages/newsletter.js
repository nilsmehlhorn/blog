import Layout from '../components/layout'
import SEO from '../components/seo'
import React from 'react'
import {graphql} from 'gatsby'
import Img from 'gatsby-image'
import styles from './newsletter.module.scss'
import Form from '../../content/newsletter_form.html'

const NewsletterPage = ({data}) => {
  const {newsletter} = data
  const desc = 'Newsletter on web technologies like Angular, Spring, Node.js as well as product building and agile development processes.'
  return <Layout>
    <SEO description={desc} key={'seo'} title={'Newsletter'} noMailSignup={true}
         keywords={['consulting', 'angular', 'javascript', 'nodejs', 'nativescript']}/>
    <div className={styles.content}>
      <div className={styles.newsletterCta}>
        <div dangerouslySetInnerHTML={{__html: Form}}/>
        <Img className={styles.newsletterImg} fluid={newsletter.childImageSharp.fluid}/>
      </div>
    </div>
  </Layout>
}
export default NewsletterPage

export const pageQuery = graphql`
  query {
    newsletter: file(relativePath: { eq: "ijs_talk.jpeg" }) {
      childImageSharp {
        fluid(maxWidth: 964, quality: 100) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`
