import * as React from 'react'
import { Modal, View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native'
import type { Announcement, AssetMap } from '@xpkit-dev/core'

export interface WhatsNewProps {
  entries: Announcement[]
  assetMap: AssetMap
  onDismiss: () => void
}

export function WhatsNew({ entries, assetMap, onDismiss }: WhatsNewProps) {
  if (entries.length === 0) return null

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.heading}>What's New</Text>
          <ScrollView style={styles.scroll}>
            {entries.map((entry) => {
              const imageSource = entry.image ? assetMap[entry.image.key] : undefined
              return (
                <View key={entry.id} style={styles.entry}>
                  {imageSource != null && (
                    <Image source={imageSource as never} style={styles.image} />
                  )}
                  <Text style={styles.version}>v{entry.version}</Text>
                  <Text style={styles.title}>{entry.title}</Text>
                  <Text style={styles.description}>{entry.description}</Text>
                </View>
              )
            })}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  entry: {
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#444',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
