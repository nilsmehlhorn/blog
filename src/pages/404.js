import React from 'react'

import Layout from '../components/layout'
import SEO from '../components/seo'

const NotFoundPage = () => (
  <Layout>
    <SEO title="404: Not found" />
    <h1>NOT FOUND</h1>
    <p>Looks like you've made a wrong turn somewhere...</p>
  </Layout>
)

export default NotFoundPage
