pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'   // ← must match the Name you set above
    }

    stages {
        stage('Build') {
            steps {
                sh 'pwd'
                sh 'docker-compose up'
            }
        }

        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/Maysamaysa/secure.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Test') {
            steps {
                dir('backend') { sh 'npm test' }
                dir('frontend') { sh 'npm test -- --watchAll=false' }
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
