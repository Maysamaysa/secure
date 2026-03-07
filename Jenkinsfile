pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'   // ← must match the Name you set above
    }

    stages {
        // the declarative pipeline performs a checkout automatically at start
        stage('Docker Compose') {
            steps {
                script {
                    // only run compose if the command exists, avoids "command not found" errors
                    if (sh(script: 'command -v docker-compose', returnStatus: true) == 0) {
                        sh 'pwd'
                        sh 'docker-compose up -d'
                    } else {
                        echo 'docker-compose not installed, skipping compose step'
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run dev'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run dev'
                }
            }
        }

        stage('Test') {
            steps {
                dir('backend') { sh 'npm run test' }
            }
        }

        // stage('Deploy') {
        //     steps {
        //          e.g. copy build to server, run docker-compose, etc.
        //         sh 'echo "Add your deploy command here"'
        //     }
        // }
    }

    post {
        success { echo 'Pipeline succeeded!' }
        failure  { echo 'Pipeline failed.' }
    }
}
