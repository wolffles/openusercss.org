import {pick} from 'lodash'
import {search as remoteSearch} from './helpers/remotes/queries'
import db, {upsert} from '../db'

export default async ({commit, getters}, {terms, limit, skip}) => {
  commit('loading', true)

  try {
    const themes = db.getCollection('themes')
    const users = db.getCollection('users')
    const {data} = await remoteSearch({terms, limit, skip})
    const {search} = data

    search.themes.forEach((theme) => {
      const savedTheme = pick(theme, [
        '_id',
        'title',
        'version',
        'content',
        'createdAt',
        'lastUpdate',
        'rating',
        'description'
      ])

      savedTheme.user = {
        '_id': theme.user._id
      }
      upsert(themes, savedTheme)
    })
    search.users.forEach((user) => {
      const savedUser = pick(user, [
        '_id',
        'title',
        'version',
        'content',
        'createdAt',
        'lastUpdate',
        'rating',
        'description'
      ])
      const userThemes = []

      user.themes.forEach((theme) => {
        userThemes.push({
          '_id': theme._id
        })
      })
      savedUser.themes = userThemes
      upsert(users, savedUser)
    })
    commit('actionError', null)
    commit('loading', false)
    return search
  } catch (error) {
    commit('actionError', error)
  }

  commit('loading', false)
}