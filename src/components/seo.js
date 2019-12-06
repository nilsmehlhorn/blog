import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import {StaticQuery, graphql} from 'gatsby'

function SEO({description, lang, meta, keywords, title, previewImage}) {
  return (
    <StaticQuery
      query={detailsQuery}
      render={data => {
        const titleTemplate = title === data.site.siteMetadata.title ? `%s` : `%s | ${data.site.siteMetadata.title}`
        const metaDescription =
          description || data.site.siteMetadata.description
        const imgSrc = previewImage || data.img.childImageSharp.fixed.src
        const twitterMeta = [
          {name: 'twitter:creator', content: data.site.siteMetadata.author},
          {name: 'twitter:title', content: title},
          {name: 'twitter:description', content: metaDescription},
          {name: 'twitter:image', content: data.site.siteMetadata.baseUrl + imgSrc},
          {name: 'twitter:card', content: previewImage ? 'summary_large_image' : 'summary'}
        ]
        const keywordsMeta = keywords.length ? {name: 'keywords', content: keywords.join(', ')} : []
        return (
          <Helmet
            htmlAttributes={{
              lang
            }}
            title={title}
            titleTemplate={titleTemplate}
            meta={[
              {name: 'description', content: metaDescription},
              {property: 'og:title', content: title},
              {property: 'og:description', content: metaDescription},
              {property: 'og:type', content: 'website'},
              keywordsMeta,
              ...twitterMeta,
              ...meta
            ]}
          >
            <script>{`
          (function(m,a,i,l,e,r){ m['MailerLiteObject']=e;function f(){
          var c={ a:arguments,q:[]};var r=this.push(c);return "number"!=typeof r?r:f.bind(c.q);}
          f.q=f.q||[];m[e]=m[e]||f.bind(f.q);m[e].q=m[e].q||f.q;r=a.createElement(i);
          var _=a.getElementsByTagName(i)[0];r.async=1;r.src=l+'?v'+(~~(new Date().getTime()/1000000));
          _.parentNode.insertBefore(r,_);})(window, document, 'script', 'https://static.mailerlite.com/js/universal.js', 'ml');

          var ml_account = ml('accounts', '1661492', 'z6v6l1q6j9', 'load');
        `}</script>
            <script>{`
              var ml_webform_1483080 = ml_account('webforms', '1483080', 'd1c0b1', 'load');
              ml_webform_1483080('animation', 'slideboxRight');
            `}</script>
          </Helmet>
        )
      }}
    />
  )
}

SEO.defaultProps = {
  lang: 'en',
  meta: [],
  keywords: []
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired
}

export default SEO

const detailsQuery = graphql`
  query DefaultSEOQuery {
    site {
      siteMetadata {
        title
        description
        author
        baseUrl
      }
    }
    img: file(relativePath: { eq: "twitter_card.jpg" }) {
      childImageSharp {
        fixed(width: 256, height: 256) {
          ...GatsbyImageSharpFixed
        }
      }
    }
  }
`
