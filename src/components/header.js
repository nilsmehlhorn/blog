import {Link, graphql, StaticQuery} from 'gatsby'
import PropTypes from 'prop-types'
import React from 'react'
import Img from 'gatsby-image'

import styles from './header.module.scss'

const Header = ({siteTitle}) => (
  <StaticQuery
    query={graphql`
      query HeadingQuery {
        img: file(relativePath: { eq: "icon.png" }) {
          childImageSharp {
            fluid(maxWidth: 92) {
              ...GatsbyImageSharpFluid
            }
          }
        }
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <header className={styles.header}>
        <div className={styles.content}>
          <Link to="/">
            <Img className={styles.logo} fluid={data.img.childImageSharp.fluid}/>
          </Link>
          <div className={styles.pageHeadingWrapper}>
            <h2 className={styles.heading}>
              {data.site.siteMetadata.title}
            </h2>
            <p className={styles.claim}>Blog by Nils Mehlhorn</p>
          </div>
        </div>
      </header>
    )}
  />
)

Header.propTypes = {
  siteTitle: PropTypes.string
}

Header.defaultProps = {
  siteTitle: ''
}

export default Header