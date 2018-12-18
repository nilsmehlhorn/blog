import React from "react"
import {graphql} from "gatsby"
import Layout from "../components/layout"
import Tags from "../components/tags"
import SEO from '../components/seo'

import styles from './post-template.module.scss'

export default function Template({
                                   data,
                                 }) {
  const {markdownRemark} = data
  const {frontmatter, html} = markdownRemark
  return (
    <Layout>
      <SEO keywords={frontmatter.tags} title={frontmatter.title}/>
      <div className="post-container">
        <div className="post">
          <h1 className={styles.heading}>{frontmatter.title}</h1>
          <p className={styles.date}>{frontmatter.date}</p>
          <Tags tags={frontmatter.tags}/>
          <div
            className="post-content"
            dangerouslySetInnerHTML={{__html: html}}
          />
        </div>
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
        tags
      }
    }
  }
`