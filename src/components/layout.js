import React from 'react'
import PropTypes from 'prop-types'
import {graphql, StaticQuery} from 'gatsby'

import Header from './header'
import Footer from './footer'
import '../styles/styles.scss'

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
        <div className="site">
          <Header siteTitle={data.site.siteMetadata.title}/>
          <main className="content">
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
