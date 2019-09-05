import React from "react"
import {graphql} from "gatsby"
import Layout from "../components/layout"
import Tags from "../components/tags"
import SEO from '../components/seo'

import styles from './post-template.module.scss'
import RelatedPosts from '../components/related-posts'

export default function Template({
                                   data, pageContext
                                 }) {
  const {markdownRemark} = data
  const {frontmatter, html, excerpt} = markdownRemark
  return (
    <Layout>
      <SEO keywords={[...frontmatter.tags, ...frontmatter.keywords]} title={frontmatter.title} description={excerpt}/>
      <div>
        <div className="post">
          <h1 className={styles.heading}>{frontmatter.title}</h1>
          <p className={styles.date}>{frontmatter.date}</p>
          <Tags tags={frontmatter.tags}/>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{__html: html}}
          />
        </div>
      </div>
      <RelatedPosts posts={pageContext.relatedPosts}/>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt(pruneLength: 250)
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
        tags
        keywords
      }
    }
  }
`
