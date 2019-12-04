import React from 'react'
import {graphql} from 'gatsby'
import Img from 'gatsby-image'
import Layout from '../components/layout'
import Tags from '../components/tags'
import SEO from '../components/seo'
import Bio from '../components/bio'

import styles from './post-template.module.scss'
import RelatedPosts from '../components/related-posts'
import Comments from '../components/comments'

export default function Template({data}) {
  const {markdownRemark, relatedPosts} = data
  const {frontmatter, html, excerpt} = markdownRemark
  const description = frontmatter.description || excerpt
  let banner = ''
  let previewImage
  if (frontmatter.banner) {
    banner = <Img fluid={frontmatter.banner.full.fluid}/>
    previewImage = frontmatter.banner.preview.fluid.src
  }
  return (
    <Layout>
      <SEO previewImage={previewImage} keywords={[...frontmatter.tags, ...frontmatter.keywords]}
           title={frontmatter.title} description={description}/>
      <div>
        {banner}
        <div className="content-padding">
          <h1 className={styles.heading}>{frontmatter.title}</h1>
          <p className={styles.date}>{frontmatter.date}</p>
          <Tags tags={frontmatter.tags}/>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{__html: html}}
          />
        </div>
      </div>
      <Bio/>
      <Comments id={frontmatter.path}/>
      <RelatedPosts posts={relatedPosts.nodes}/>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($path: String!, $relatedPosts: [String!]!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt(pruneLength: 250)
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
        tags
        keywords
        description
        banner {
          full: childImageSharp {
            fluid(maxWidth: 960, maxHeight: 400) {
              ...GatsbyImageSharpFluid
            }
          }
          preview: childImageSharp {
            fluid(maxWidth: 630) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
    relatedPosts: allMarkdownRemark(filter: {frontmatter: { path: { in: $relatedPosts } } }) {
      nodes {
        id
        excerpt(pruneLength: 250)
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          path
          title
          tags
          description
          banner {
            preview: childImageSharp {
              fluid(maxWidth: 630) {
                ...GatsbyImageSharpFluid
              }
            }
          }
        }
      }
    }
  }
`
