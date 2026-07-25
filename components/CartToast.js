const styles = StyleSheet.create({
  // ... other styles ...
  
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',      // Teal dark (was #1B5E20)
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: width - 60,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#14B8A6',      // Teal light (was #4CAF50)
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  toastBold: {
    fontWeight: '700',
    color: '#fff',
  },
});