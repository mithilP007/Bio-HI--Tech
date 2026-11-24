#!/usr/bin/env bash
# ==============================================================================
# BIO HI TECH LIMS — SECURE LOCAL ANDROID RELEASE KEYSTORE GENERATOR
# ==============================================================================
# This script interactively and securely generates an Android production release
# keystore without echoing passwords to terminal logs, history, or disk files.
#
# Output:
# 1. release-key.jks (Protected Java Keystore — NEVER commit to Git)
# 2. Base64 payload instructions for GitHub Actions Secret: ANDROID_KEYSTORE_BASE64
# ==============================================================================

set -euo pipefail

KEYSTORE_FILE="release-key.jks"
ALIAS_DEFAULT="biohitech-release"
VALIDITY_DAYS=10000

echo "=============================================================================="
echo "BIO HI TECH LIMS — ANDROID RELEASE KEYSTORE GENERATOR"
echo "=============================================================================="
echo "Target keystore file: ${KEYSTORE_FILE}"
echo ""

if [ -f "${KEYSTORE_FILE}" ]; then
  echo "WARNING: ${KEYSTORE_FILE} already exists in the current directory."
  read -r -p "Overwrite existing keystore? (y/N): " OVERWRITE
  if [[ ! "${OVERWRITE}" =~ ^[Yy]$ ]]; then
    echo "Aborted. Existing keystore preserved."
    exit 0
  fi
  rm -f "${KEYSTORE_FILE}"
fi

echo "Please choose a key alias (default: ${ALIAS_DEFAULT}):"
read -r -p "Key Alias [${ALIAS_DEFAULT}]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-$ALIAS_DEFAULT}

echo ""
echo "Enter Keystore Password (input will be hidden):"
read -r -s KEYSTORE_PASSWORD
echo ""

echo "Confirm Keystore Password:"
read -r -s KEYSTORE_PASSWORD_CONFIRM
echo ""

if [ "${KEYSTORE_PASSWORD}" != "${KEYSTORE_PASSWORD_CONFIRM}" ]; then
  echo "ERROR: Keystore passwords do not match. Aborting."
  exit 1
fi

if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
  echo "ERROR: Keystore password must be at least 6 characters long."
  exit 1
fi

echo "Generating RSA 2048-bit release keystore with ${VALIDITY_DAYS} days validity..."

keytool -genkeypair -v \
  -keystore "${KEYSTORE_FILE}" \
  -alias "${KEY_ALIAS}" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "${VALIDITY_DAYS}" \
  -storepass "${KEYSTORE_PASSWORD}" \
  -keypass "${KEYSTORE_PASSWORD}" \
  -dname "CN=Dr. Arun Kumar, OU=Laboratory Services, O=BIO HI TECH, L=Mumbai, ST=Maharashtra, C=IN"

echo ""
echo "=============================================================================="
echo "KEYSTORE GENERATED SUCCESSFULLY: ${KEYSTORE_FILE}"
echo "=============================================================================="
echo ""
echo "NEXT STEPS FOR CI/CD RELEASE SIGNING:"
echo "1. Encode the keystore to base64:"
echo "   base64 -w 0 ${KEYSTORE_FILE} > release-key.base64"
echo ""
echo "2. Add the following secrets to GitHub Repository (Settings -> Secrets & Variables -> Actions):"
echo "   - ANDROID_KEYSTORE_BASE64    : Content of release-key.base64"
echo "   - ANDROID_KEYSTORE_PASSWORD  : (Your keystore password)"
echo "   - ANDROID_KEY_ALIAS          : ${KEY_ALIAS}"
echo "   - ANDROID_KEY_PASSWORD       : (Your keystore password)"
echo ""
echo "3. Clean up the base64 file once copied:"
echo "   rm -f release-key.base64"
echo ""
echo "CRITICAL: Never commit ${KEYSTORE_FILE} or passwords to Git!"
echo "=============================================================================="
