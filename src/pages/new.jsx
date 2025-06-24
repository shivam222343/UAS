<span
                        className={`flex items-center text-sm rounded-full ${member.isOnline === true
                            ? 'bg-transparent font-semibold text-green-500'
                            : member.isOnline === false
                              ? 'bg-transparent font-semibold text-gray-600 dark:text-gray-300'
                              : 'bg-transparent font-semibold text-yellow-600'
                          }`}
                      >
                     {
                      member.isOnline !== true &&    <Eye className="h-4 w-4 mr-1" />
                     }
                        {member.isOnline === false
                          ? member.lastSeen
                            ? `Last seen: ${new Date(member.lastSeen.seconds * 1000).toLocaleString()}`
                            : 'Offline'
                          : ''}
                      </span>