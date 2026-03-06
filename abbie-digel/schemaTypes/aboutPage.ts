import {defineType, defineField, defineArrayMember} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
})
