import Layout from '../components/layout'
import SEO from '../components/seo'
import React from 'react'
import {graphql} from 'gatsby'

const PrivacyPage = ({data: {markdownRemark: {html}}}) => {
  return <Layout>
    <SEO key={'seo'} title={'Consulting'}/>
    <div className="content-padding" dangerouslySetInnerHTML={{__html: html}}/>
  </Layout>
}
export default PrivacyPage

export const pageQuery = graphql`
  query {
    markdownRemark(frontmatter: {path: {eq: "privacy"}}) {
      html
    }
  }
`
