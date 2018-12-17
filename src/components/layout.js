import React from 'react'
import PropTypes from 'prop-types'
import {StaticQuery, graphql} from 'gatsby'

import Header from './header'
import Footer from './footer'
import styles from './layout.module.scss'

const Layout = ({children}) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <div className={styles.site}>
          <Header siteTitle={data.site.siteMetadata.title}/>
          <main className={styles.content}>
            {children}
          </main>
          <Footer/>
        </div>
      </>
    )}
  />
)

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout
